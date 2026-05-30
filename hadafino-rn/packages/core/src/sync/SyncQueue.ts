import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, SyncQueueItemModel } from '../db/database';
import type { SyncableEntity, SyncOperation } from '../types';

const MAX_RETRY_COUNT = 5;

interface EnqueueOptions {
  entity: SyncableEntity;
  operation: SyncOperation;
  localId: string;
  serverId?: number | null;
  payload: Record<string, unknown>;
}

export class SyncQueue {
  static async enqueue(options: EnqueueOptions): Promise<void> {
    const db = getDatabase();
    await db.write(async () => {
      await db.get<SyncQueueItemModel>('sync_queue').create((item) => {
        item._raw.id = uuidv4();
        item.entity = options.entity;
        item.operation = options.operation;
        item.localId = options.localId;
        item.serverId = options.serverId ?? null;
        item.payload = JSON.stringify(options.payload);
        item.retryCount = 0;
        item.lastError = null;
        item.status = 'pending';
      });
    });
  }

  static async getPending(): Promise<SyncQueueItemModel[]> {
    const db = getDatabase();
    return db
      .get<SyncQueueItemModel>('sync_queue')
      .query(
        Q.where('status', Q.oneOf(['pending', 'failed'])),
        Q.where('retry_count', Q.lt(MAX_RETRY_COUNT)),
        Q.sortBy('created_at', Q.asc),
      )
      .fetch();
  }

  static async markComplete(id: string): Promise<void> {
    const db = getDatabase();
    const item = await db.get<SyncQueueItemModel>('sync_queue').find(id);
    await db.write(async () => {
      await item.destroyPermanently();
    });
  }

  static async markFailed(id: string, error: string): Promise<void> {
    const db = getDatabase();
    const item = await db.get<SyncQueueItemModel>('sync_queue').find(id);
    await db.write(async () => {
      await item.update((record) => {
        record.retryCount += 1;
        record.lastError = error;
        record.status = record.retryCount >= MAX_RETRY_COUNT ? 'failed' : 'pending';
      });
    });
  }

  static async markProcessing(id: string): Promise<void> {
    const db = getDatabase();
    const item = await db.get<SyncQueueItemModel>('sync_queue').find(id);
    await db.write(async () => {
      await item.update((record) => {
        record.status = 'processing';
      });
    });
  }

  static async updateServerId(localId: string, serverId: number): Promise<void> {
    const db = getDatabase();
    const items = await db
      .get<SyncQueueItemModel>('sync_queue')
      .query(Q.where('local_id', localId))
      .fetch();

    if (items.length > 0) {
      await db.write(async () => {
        for (const item of items) {
          await item.update((record) => {
            record.serverId = serverId;
          });
        }
      });
    }
  }

  static async clearAll(): Promise<void> {
    const db = getDatabase();
    const allItems = await db.get<SyncQueueItemModel>('sync_queue').query().fetch();
    await db.write(async () => {
      for (const item of allItems) {
        await item.destroyPermanently();
      }
    });
  }

  static async getPendingCount(): Promise<number> {
    const db = getDatabase();
    return db
      .get<SyncQueueItemModel>('sync_queue')
      .query(Q.where('status', Q.oneOf(['pending', 'failed'])))
      .fetchCount();
  }
}

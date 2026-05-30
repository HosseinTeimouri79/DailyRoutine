import { Q } from '@nozbe/watermelondb';
import { getDatabase, SyncMetadataModel } from '../db/database';
import type { SyncableEntity } from '../types';

export const SYNCABLE_ENTITIES: SyncableEntity[] = [
  'routines',
  'routine_logs',
  'daily_tasks',
  'notes',
  'important_days',
];

export class SyncMetadataStore {
  static async getLastSyncAt(entity: SyncableEntity): Promise<number> {
    const db = getDatabase();
    const records = await db
      .get<SyncMetadataModel>('sync_metadata')
      .query(Q.where('entity', entity))
      .fetch();

    return records[0]?.lastSyncAt ?? 0;
  }

  static async updateLastSyncAt(entity: SyncableEntity, timestamp: number): Promise<void> {
    const db = getDatabase();
    const records = await db
      .get<SyncMetadataModel>('sync_metadata')
      .query(Q.where('entity', entity))
      .fetch();

    await db.write(async () => {
      if (records.length > 0) {
        await records[0].update((record) => {
          record.lastSyncAt = timestamp;
          record.isDirty = false;
        });
      } else {
        await db.get<SyncMetadataModel>('sync_metadata').create((record) => {
          record.entity = entity;
          record.lastSyncAt = timestamp;
          record.isDirty = false;
        });
      }
    });
  }

  static async markDirty(entity: SyncableEntity): Promise<void> {
    const db = getDatabase();
    const records = await db
      .get<SyncMetadataModel>('sync_metadata')
      .query(Q.where('entity', entity))
      .fetch();

    await db.write(async () => {
      if (records.length > 0) {
        await records[0].update((record) => {
          record.isDirty = true;
        });
      }
    });
  }

  static async resetAll(): Promise<void> {
    const db = getDatabase();
    const records = await db.get<SyncMetadataModel>('sync_metadata').query().fetch();
    await db.write(async () => {
      for (const record of records) {
        await record.destroyPermanently();
      }
    });
  }
}

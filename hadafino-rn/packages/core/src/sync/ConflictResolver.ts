import { Q } from '@nozbe/watermelondb';
import {
  getDatabase,
  RoutineModel,
  RoutineLogModel,
  DailyTaskModel,
  NoteModel,
  ImportantDayModel,
} from '../db/database';
import type { SyncableEntity, ConflictStrategy } from '../types';
import type { SyncQueueItemModel } from '../db/models/SyncQueueItem';

const CONFLICT_STRATEGIES: Record<SyncableEntity, ConflictStrategy> = {
  routines: 'server-wins',
  routine_logs: 'merge',
  daily_tasks: 'last-write-wins',
  notes: 'last-write-wins',
  important_days: 'last-write-wins',
};

interface ServerRecord {
  id: number;
  updated_at?: number;
  [key: string]: unknown;
}

export class ConflictResolver {
  static async resolve(
    queueItem: SyncQueueItemModel,
    serverRecord: ServerRecord,
  ): Promise<void> {
    const strategy = CONFLICT_STRATEGIES[queueItem.entity];
    const localPayload = JSON.parse(queueItem.payload) as Record<string, unknown>;

    switch (strategy) {
      case 'server-wins':
        await this.applyServerWins(queueItem.entity, serverRecord);
        break;

      case 'last-write-wins':
        await this.applyLastWriteWins(
          queueItem.entity,
          queueItem.localId,
          serverRecord,
          localPayload,
        );
        break;

      case 'merge':
        await this.applyMerge(queueItem.entity, queueItem.localId, serverRecord, localPayload);
        break;
    }
  }

  private static async applyServerWins(
    entity: SyncableEntity,
    serverRecord: ServerRecord,
  ): Promise<void> {
    const db = getDatabase();
    const tableMap: Record<SyncableEntity, string> = {
      routines: 'routines',
      routine_logs: 'routine_logs',
      daily_tasks: 'daily_tasks',
      notes: 'notes',
      important_days: 'important_days',
    };

    const records = await db
      .get(tableMap[entity])
      .query(Q.where('server_id', serverRecord.id))
      .fetch();

    if (records.length === 0) return;

    await db.write(async () => {
      await records[0].update((record) => {
        Object.assign(record, serverRecord);
        (record as { isDirty: boolean }).isDirty = false;
      });
    });
  }

  private static async applyLastWriteWins(
    entity: SyncableEntity,
    localId: string,
    serverRecord: ServerRecord,
    localPayload: Record<string, unknown>,
  ): Promise<void> {
    const serverUpdatedAt = (serverRecord.updated_at ?? 0) as number;
    const localUpdatedAt = (localPayload.updated_at ?? 0) as number;

    if (serverUpdatedAt >= localUpdatedAt) {
      await this.applyServerWins(entity, serverRecord);
    }
  }

  private static async applyMerge(
    entity: SyncableEntity,
    localId: string,
    serverRecord: ServerRecord,
    localPayload: Record<string, unknown>,
  ): Promise<void> {
    if (entity === 'routine_logs') {
      await this.mergeRoutineLogs(localId, serverRecord);
    }
  }

  private static async mergeRoutineLogs(
    localId: string,
    serverRecord: ServerRecord,
  ): Promise<void> {
    const db = getDatabase();
    const localRecord = await db
      .get<RoutineLogModel>('routine_logs')
      .find(localId)
      .catch(() => null);

    if (!localRecord) return;

    const existingByServer = await db
      .get<RoutineLogModel>('routine_logs')
      .query(Q.where('server_id', serverRecord.id))
      .fetch();

    if (existingByServer.length === 0) {
      await db.write(async () => {
        await localRecord.update((record) => {
          record.serverId = serverRecord.id;
          record.isDirty = false;
        });
      });
    }
  }
}

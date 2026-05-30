import { Q } from '@nozbe/watermelondb';
import { apiClient, ApiError } from '../api/client';
import { SyncQueue } from './SyncQueue';
import { SyncMetadataStore, SYNCABLE_ENTITIES } from './SyncMetadataStore';
import { ConflictResolver } from './ConflictResolver';
import { getDatabase, RoutineModel, RoutineLogModel, DailyTaskModel, NoteModel, ImportantDayModel } from '../db/database';
import type { SyncableEntity, SyncQueueItem } from '../types';
import type { SyncQueueItemModel } from '../db/models/SyncQueueItem';

type NetworkStatusProvider = () => boolean;

const SYNC_INTERVAL_MS = 30_000;
const MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exponentialBackoff(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 30_000);
}

class SyncEngineClass {
  private _isSyncing = false;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _getIsOnline: NetworkStatusProvider = () => true;
  private _onSyncStatusChange?: (status: SyncStatus) => void;

  configure(options: {
    getIsOnline: NetworkStatusProvider;
    onSyncStatusChange?: (status: SyncStatus) => void;
  }): void {
    this._getIsOnline = options.getIsOnline;
    this._onSyncStatusChange = options.onSyncStatusChange;
  }

  startAutoSync(): void {
    if (this._intervalId !== null) return;
    this._intervalId = setInterval(() => {
      void this.sync();
    }, SYNC_INTERVAL_MS);
  }

  stopAutoSync(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  async syncOnReconnect(): Promise<void> {
    await this.sync();
  }

  async sync(): Promise<SyncResult> {
    if (this._isSyncing || !this._getIsOnline()) {
      return { pushed: 0, pulled: 0, errors: [] };
    }

    this._isSyncing = true;
    this._onSyncStatusChange?.({ type: 'syncing' });

    try {
      const pushResult = await this.pushPendingChanges();
      const pullResult = await this.pullServerChanges();

      const result: SyncResult = {
        pushed: pushResult.processed,
        pulled: pullResult.applied,
        errors: [...pushResult.errors, ...pullResult.errors],
      };

      this._onSyncStatusChange?.({
        type: result.errors.length > 0 ? 'partial' : 'idle',
        lastSyncAt: Date.now(),
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error';
      this._onSyncStatusChange?.({ type: 'error', error: message });
      return { pushed: 0, pulled: 0, errors: [message] };
    } finally {
      this._isSyncing = false;
    }
  }

  private async pushPendingChanges(): Promise<{ processed: number; errors: string[] }> {
    const pending = await SyncQueue.getPending();
    let processed = 0;
    const errors: string[] = [];

    for (const item of pending) {
      await SyncQueue.markProcessing(item.id);

      try {
        const payload = JSON.parse(item.payload) as Record<string, unknown>;
        const result = await this.executeMutation(item.entity, item.operation, item.serverId, payload);

        await SyncQueue.markComplete(item.id);
        processed++;

        if (result && typeof result === 'object' && 'id' in result) {
          await this.mapLocalToServerId(item.entity, item.localId, (result as { id: number }).id);
        }
      } catch (error) {
        if (error instanceof ApiError && error.isConflict && error.serverRecord) {
          await ConflictResolver.resolve(item, error.serverRecord as { id: number; [key: string]: unknown });
          await SyncQueue.markComplete(item.id);
        } else {
          const message = error instanceof Error ? error.message : 'Push failed';
          await SyncQueue.markFailed(item.id, message);
          errors.push(`[${item.entity}/${item.operation}]: ${message}`);
        }
      }
    }

    return { processed, errors };
  }

  private async executeMutation(
    entity: SyncableEntity,
    operation: string,
    serverId: number | null,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    switch (entity) {
      case 'routines':
        if (operation === 'create') return apiClient.routines.create(payload as never);
        if (operation === 'update' && serverId) return apiClient.routines.update(serverId, payload);
        if (operation === 'delete' && serverId) return apiClient.routines.delete(serverId);
        break;

      case 'daily_tasks':
        if (operation === 'create') return apiClient.dailyTasks.create(payload as never);
        if (operation === 'update' && serverId) return apiClient.dailyTasks.update(serverId, payload);
        if (operation === 'delete' && serverId) return apiClient.dailyTasks.delete(serverId);
        break;

      case 'notes':
        if (operation === 'create') return apiClient.notes.create(payload as never);
        if (operation === 'update' && serverId) return apiClient.notes.update(serverId, payload);
        if (operation === 'delete' && serverId) return apiClient.notes.delete(serverId);
        break;

      case 'important_days':
        if (operation === 'create') return apiClient.importantDays.create(payload as never);
        if (operation === 'update' && serverId) return apiClient.importantDays.update(serverId, payload);
        if (operation === 'delete' && serverId) return apiClient.importantDays.delete(serverId);
        break;

      case 'routine_logs':
        if (operation === 'upsert') return apiClient.routineLogs.upsert(payload as never);
        break;
    }

    return null;
  }

  private async pullServerChanges(): Promise<{ applied: number; errors: string[] }> {
    let applied = 0;
    const errors: string[] = [];

    for (const entity of SYNCABLE_ENTITIES) {
      try {
        const since = await SyncMetadataStore.getLastSyncAt(entity);
        const changes = await apiClient.sync.getChangedSince(entity, since);

        await this.applyServerChanges(entity, changes);
        await SyncMetadataStore.updateLastSyncAt(entity, Date.now());
        applied += changes.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pull failed';
        errors.push(`[${entity}]: ${message}`);
      }
    }

    return { applied, errors };
  }

  private async applyServerChanges(entity: SyncableEntity, records: unknown[]): Promise<void> {
    if (records.length === 0) return;

    const db = getDatabase();
    const tableMap: Record<SyncableEntity, string> = {
      routines: 'routines',
      routine_logs: 'routine_logs',
      daily_tasks: 'daily_tasks',
      notes: 'notes',
      important_days: 'important_days',
    };

    const tableName = tableMap[entity];

    await db.write(async () => {
      for (const serverRecord of records) {
        if (typeof serverRecord !== 'object' || serverRecord === null) continue;
        const record = serverRecord as Record<string, unknown>;
        const serverId = record.id as number;

        const existing = await db
          .get(tableName)
          .query(Q.where('server_id', serverId))
          .fetch();

        if (existing.length > 0) {
          const localRecord = existing[0];
          if (!(localRecord as { isDirty: boolean }).isDirty) {
            await localRecord.update((r) => {
              this.mapServerRecordToModel(entity, r as Record<string, unknown>, record);
            });
          }
        } else {
          await db.get(tableName).create((r) => {
            this.mapServerRecordToModel(entity, r as Record<string, unknown>, record);
            (r as { isDirty: boolean }).isDirty = false;
            (r as { isDeletedLocally: boolean }).isDeletedLocally = false;
          });
        }
      }
    });
  }

  private mapServerRecordToModel(
    entity: SyncableEntity,
    model: Record<string, unknown>,
    record: Record<string, unknown>,
  ): void {
    model.serverId = record.id;
    model.isDirty = false;

    switch (entity) {
      case 'routines':
        model.userId = record.user_id;
        model.title = record.title;
        model.color = record.color ?? null;
        model.icon = record.icon ?? null;
        model.isActive = record.is_active ?? true;
        model.recurrenceMode = record.recurrence_mode ?? 'specific_weekdays';
        model.recurrenceWeekdays = record.recurrence_weekdays ?? [];
        model.recurrenceDayOfWeek = record.recurrence_day_of_week ?? null;
        model.recurrenceDayOfMonth = record.recurrence_day_of_month ?? null;
        model.alarmEnabled = record.alarm_enabled ?? false;
        model.alarmTime = record.alarm_time ?? null;
        break;

      case 'routine_logs':
        model.routineServerId = record.routine_id;
        model.date = record.date;
        model.status = record.status;
        break;

      case 'daily_tasks':
        model.userId = record.user_id;
        model.taskDate = record.task_date;
        model.content = record.content;
        model.isDone = record.is_done ?? false;
        model.alarmEnabled = record.alarm_enabled ?? false;
        model.alarmTime = record.alarm_time ?? null;
        break;

      case 'notes':
        model.userId = record.user_id;
        model.content = record.content;
        break;

      case 'important_days':
        model.userId = record.user_id;
        model.title = record.title;
        model.description = record.description ?? null;
        model.eventDate = record.event_date;
        model.eventTime = record.event_time;
        model.icon = record.icon ?? null;
        model.iconColor = record.icon_color ?? null;
        break;
    }
  }

  private async mapLocalToServerId(
    entity: SyncableEntity,
    localId: string,
    serverId: number,
  ): Promise<void> {
    const db = getDatabase();
    const tableMap: Record<SyncableEntity, string> = {
      routines: 'routines',
      routine_logs: 'routine_logs',
      daily_tasks: 'daily_tasks',
      notes: 'notes',
      important_days: 'important_days',
    };

    try {
      const record = await db.get(tableMap[entity]).find(localId);
      await db.write(async () => {
        await record.update((r) => {
          (r as { serverId: number }).serverId = serverId;
          (r as { isDirty: boolean }).isDirty = false;
        });
      });
    } catch {
      // Record may have been deleted locally
    }

    await SyncQueue.updateServerId(localId, serverId);
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }
}

export type SyncStatus =
  | { type: 'idle'; lastSyncAt?: number }
  | { type: 'syncing' }
  | { type: 'partial'; lastSyncAt: number }
  | { type: 'error'; error: string };

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

export const SyncEngine = new SyncEngineClass();

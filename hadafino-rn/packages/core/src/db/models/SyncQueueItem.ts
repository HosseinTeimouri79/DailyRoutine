import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import type { SyncableEntity, SyncOperation } from '../../types';

export class SyncQueueItemModel extends Model {
  static table = 'sync_queue';

  @field('entity') declare entity: SyncableEntity;
  @field('operation') declare operation: SyncOperation;
  @field('local_id') declare localId: string;
  @field('server_id') declare serverId: number | null;
  @field('payload') declare payload: string;
  @field('retry_count') declare retryCount: number;
  @field('last_error') declare lastError: string | null;
  @field('status') declare status: 'pending' | 'processing' | 'failed';
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

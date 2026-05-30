import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';
import type { SyncableEntity } from '../../types';

export class SyncMetadataModel extends Model {
  static table = 'sync_metadata';

  @field('entity') declare entity: SyncableEntity;
  @field('last_sync_at') declare lastSyncAt: number;
  @field('is_dirty') declare isDirty: boolean;
  @date('updated_at') declare updatedAt: Date;
}

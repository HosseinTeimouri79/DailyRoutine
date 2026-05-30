import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class NoteModel extends Model {
  static table = 'notes';

  @field('server_id') declare serverId: number | null;
  @field('user_id') declare userId: number;
  @field('content') declare content: string;
  @field('is_dirty') declare isDirty: boolean;
  @field('is_deleted_locally') declare isDeletedLocally: boolean;
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class ImportantDayModel extends Model {
  static table = 'important_days';

  @field('server_id') declare serverId: number | null;
  @field('user_id') declare userId: number;
  @field('title') declare title: string;
  @field('description') declare description: string | null;
  @field('event_date') declare eventDate: number;
  @field('event_time') declare eventTime: string;
  @field('icon') declare icon: string | null;
  @field('icon_color') declare iconColor: string | null;
  @field('is_dirty') declare isDirty: boolean;
  @field('is_deleted_locally') declare isDeletedLocally: boolean;
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class DailyTaskModel extends Model {
  static table = 'daily_tasks';

  @field('server_id') declare serverId: number | null;
  @field('user_id') declare userId: number;
  @field('task_date') declare taskDate: number;
  @field('content') declare content: string;
  @field('is_done') declare isDone: boolean;
  @field('alarm_enabled') declare alarmEnabled: boolean;
  @field('alarm_time') declare alarmTime: string | null;
  @field('is_dirty') declare isDirty: boolean;
  @field('is_deleted_locally') declare isDeletedLocally: boolean;
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

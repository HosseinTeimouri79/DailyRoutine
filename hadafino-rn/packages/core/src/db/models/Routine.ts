import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';
import type { RecurrenceMode } from '../../types';

function parseWeekdays(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return [];
    }
  }
  return [];
}

export class RoutineModel extends Model {
  static table = 'routines';

  @field('server_id') declare serverId: number | null;
  @field('user_id') declare userId: number;
  @field('title') declare title: string;
  @field('color') declare color: string | null;
  @field('icon') declare icon: string | null;
  @field('is_active') declare isActive: boolean;
  @field('recurrence_mode') declare recurrenceMode: RecurrenceMode;
  @json('recurrence_weekdays', parseWeekdays) declare recurrenceWeekdays: number[];
  @field('recurrence_day_of_week') declare recurrenceDayOfWeek: number | null;
  @field('recurrence_day_of_month') declare recurrenceDayOfMonth: number | null;
  @field('alarm_enabled') declare alarmEnabled: boolean;
  @field('alarm_time') declare alarmTime: string | null;
  @field('is_dirty') declare isDirty: boolean;
  @field('is_deleted_locally') declare isDeletedLocally: boolean;
  @field('server_created_at') declare serverCreatedAt: number | null;
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

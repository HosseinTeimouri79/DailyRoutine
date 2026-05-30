import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import type { RoutineLogStatus } from '../../types';

export class RoutineLogModel extends Model {
  static table = 'routine_logs';

  @field('server_id') declare serverId: number | null;
  @field('routine_id') declare routineId: string;
  @field('routine_server_id') declare routineServerId: number | null;
  @field('date') declare date: number;
  @field('status') declare status: RoutineLogStatus;
  @field('is_dirty') declare isDirty: boolean;
  @readonly @date('created_at') declare createdAt: Date;
  @date('updated_at') declare updatedAt: Date;
}

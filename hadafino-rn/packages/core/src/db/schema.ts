import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const DB_VERSION = 1;

export const schema = appSchema({
  version: DB_VERSION,
  tables: [
    tableSchema({
      name: 'routines',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'user_id', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'recurrence_mode', type: 'string' },
        { name: 'recurrence_weekdays', type: 'string' }, // JSON array
        { name: 'recurrence_day_of_week', type: 'number', isOptional: true },
        { name: 'recurrence_day_of_month', type: 'number', isOptional: true },
        { name: 'alarm_enabled', type: 'boolean' },
        { name: 'alarm_time', type: 'string', isOptional: true },
        { name: 'server_created_at', type: 'number', isOptional: true },
        { name: 'is_dirty', type: 'boolean' },
        { name: 'is_deleted_locally', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'routine_logs',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'routine_id', type: 'string' }, // local WatermelonDB ID
        { name: 'routine_server_id', type: 'number', isOptional: true },
        { name: 'date', type: 'number' },
        { name: 'status', type: 'string' }, // 'done' | 'missed'
        { name: 'is_dirty', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'daily_tasks',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'user_id', type: 'number' },
        { name: 'task_date', type: 'number' },
        { name: 'content', type: 'string' },
        { name: 'is_done', type: 'boolean' },
        { name: 'alarm_enabled', type: 'boolean' },
        { name: 'alarm_time', type: 'string', isOptional: true },
        { name: 'is_dirty', type: 'boolean' },
        { name: 'is_deleted_locally', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'notes',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'user_id', type: 'number' },
        { name: 'content', type: 'string' },
        { name: 'is_dirty', type: 'boolean' },
        { name: 'is_deleted_locally', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'important_days',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'user_id', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'event_date', type: 'number' },
        { name: 'event_time', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'icon_color', type: 'string', isOptional: true },
        { name: 'is_dirty', type: 'boolean' },
        { name: 'is_deleted_locally', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'entity', type: 'string' },
        { name: 'operation', type: 'string' },
        { name: 'local_id', type: 'string' },
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'payload', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending' | 'processing' | 'failed'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sync_metadata',
      columns: [
        { name: 'entity', type: 'string' },
        { name: 'last_sync_at', type: 'number' },
        { name: 'is_dirty', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

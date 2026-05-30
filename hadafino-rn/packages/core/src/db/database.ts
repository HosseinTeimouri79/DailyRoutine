import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { RoutineModel } from './models/Routine';
import { RoutineLogModel } from './models/RoutineLog';
import { DailyTaskModel } from './models/DailyTask';
import { NoteModel } from './models/Note';
import { ImportantDayModel } from './models/ImportantDay';
import { SyncQueueItemModel } from './models/SyncQueueItem';
import { SyncMetadataModel } from './models/SyncMetadata';

export const modelClasses = [
  RoutineModel,
  RoutineLogModel,
  DailyTaskModel,
  NoteModel,
  ImportantDayModel,
  SyncQueueItemModel,
  SyncMetadataModel,
];

let _database: Database | null = null;

export function getDatabase(): Database {
  if (!_database) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _database;
}

export function initDatabase(dbName = 'hadafino'): Database {
  if (_database) {
    return _database;
  }

  const adapter = new SQLiteAdapter({
    schema,
    dbName,
    jsi: true,
    onSetUpError: (error) => {
      console.error('[DB] Setup error:', error);
    },
  });

  _database = new Database({
    adapter,
    modelClasses,
  });

  return _database;
}

export function closeDatabase(): void {
  _database = null;
}

export {
  RoutineModel,
  RoutineLogModel,
  DailyTaskModel,
  NoteModel,
  ImportantDayModel,
  SyncQueueItemModel,
  SyncMetadataModel,
};

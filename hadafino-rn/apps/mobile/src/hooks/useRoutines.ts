import { Q } from '@nozbe/watermelondb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase, RoutineModel, RoutineLogModel, SyncQueue, type Routine, type RoutineLog, type RoutineLogStatus } from '@hadafino/core';
import { useAuthStore } from '../store/authStore';

function modelToRoutine(m: RoutineModel): Routine {
  return {
    id: m.serverId ?? 0,
    userId: m.userId,
    title: m.title,
    color: m.color ?? undefined,
    icon: m.icon ?? undefined,
    isActive: m.isActive,
    recurrenceMode: m.recurrenceMode,
    recurrenceWeekdays: m.recurrenceWeekdays,
    recurrenceDayOfWeek: m.recurrenceDayOfWeek ?? undefined,
    recurrenceDayOfMonth: m.recurrenceDayOfMonth ?? undefined,
    alarmEnabled: m.alarmEnabled,
    alarmTime: m.alarmTime ?? undefined,
    createdAt: m.createdAt.getTime(),
  };
}

function modelToLog(m: RoutineLogModel): RoutineLog {
  return {
    id: m.serverId ?? 0,
    routineId: m.routineServerId ?? 0,
    date: m.date,
    status: m.status,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export function useRoutines() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const db = getDatabase();
      const records = await db
        .get<RoutineModel>('routines')
        .query(
          Q.and(
            Q.where('is_deleted_locally', false),
            Q.where('user_id', user!.id),
          ),
        )
        .fetch();
      return records.map(modelToRoutine);
    },
    enabled: Boolean(user),
  });

  const createRoutine = useMutation({
    mutationFn: async (payload: Omit<Routine, 'id' | 'userId' | 'createdAt'>) => {
      const db = getDatabase();
      let localId = '';
      await db.write(async () => {
        const record = await db.get<RoutineModel>('routines').create((m) => {
          m.userId = user!.id;
          m.title = payload.title;
          m.color = payload.color ?? null;
          m.icon = payload.icon ?? null;
          m.isActive = payload.isActive;
          m.recurrenceMode = payload.recurrenceMode;
          m.recurrenceWeekdays = payload.recurrenceWeekdays;
          m.recurrenceDayOfWeek = payload.recurrenceDayOfWeek ?? null;
          m.recurrenceDayOfMonth = payload.recurrenceDayOfMonth ?? null;
          m.alarmEnabled = payload.alarmEnabled;
          m.alarmTime = payload.alarmTime ?? null;
          m.isDirty = true;
          m.isDeletedLocally = false;
          m.serverId = null;
        });
        localId = record.id;
      });
      await SyncQueue.enqueue({
        entity: 'routines',
        operation: 'create',
        localId,
        payload: {
          title: payload.title,
          color: payload.color,
          icon: payload.icon,
          is_active: payload.isActive,
          recurrence_mode: payload.recurrenceMode,
          recurrence_weekdays: payload.recurrenceWeekdays,
          recurrence_day_of_week: payload.recurrenceDayOfWeek ?? null,
          recurrence_day_of_month: payload.recurrenceDayOfMonth ?? null,
          alarm_enabled: payload.alarmEnabled,
          alarm_time: payload.alarmTime ?? null,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const deleteRoutine = useMutation({
    mutationFn: async (routineId: number) => {
      const db = getDatabase();
      const records = await db
        .get<RoutineModel>('routines')
        .query(Q.where('server_id', routineId))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          m.isDeletedLocally = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'routines',
        operation: 'delete',
        localId: record.id,
        serverId: routineId,
        payload: {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  return { routines, isLoading, createRoutine, deleteRoutine };
}

export function useRoutineLogs(startDate: number, endDate: number) {
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['routine_logs', startDate, endDate],
    queryFn: async () => {
      const db = getDatabase();
      const records = await db
        .get<RoutineLogModel>('routine_logs')
        .query(
          Q.and(Q.where('date', Q.gte(startDate)), Q.where('date', Q.lte(endDate))),
        )
        .fetch();
      return records.map(modelToLog);
    },
  });

  const upsertLog = useMutation({
    mutationFn: async (payload: {
      routineLocalId: string;
      routineServerId: number;
      date: number;
      status: RoutineLogStatus;
    }) => {
      const db = getDatabase();
      const existing = await db
        .get<RoutineLogModel>('routine_logs')
        .query(
          Q.and(
            Q.where('routine_server_id', payload.routineServerId),
            Q.where('date', payload.date),
          ),
        )
        .fetch();

      let localId = '';
      await db.write(async () => {
        if (existing.length > 0) {
          await existing[0].update((m) => {
            m.status = payload.status;
            m.isDirty = true;
          });
          localId = existing[0].id;
        } else {
          const record = await db.get<RoutineLogModel>('routine_logs').create((m) => {
            m.routineId = payload.routineLocalId;
            m.routineServerId = payload.routineServerId;
            m.date = payload.date;
            m.status = payload.status;
            m.isDirty = true;
            m.serverId = null;
          });
          localId = record.id;
        }
      });

      await SyncQueue.enqueue({
        entity: 'routine_logs',
        operation: 'upsert',
        localId,
        payload: {
          routine_id: payload.routineServerId,
          date: payload.date,
          status: payload.status,
        },
      });
    },
    onSuccess: (_, { date }) => qc.invalidateQueries({ queryKey: ['routine_logs'] }),
  });

  return { logs, isLoading, upsertLog };
}

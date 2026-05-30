import { Q } from '@nozbe/watermelondb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase, ImportantDayModel, SyncQueue, type ImportantDay } from '@hadafino/core';
import { useAuthStore } from '../store/authStore';

function modelToDay(m: ImportantDayModel): ImportantDay {
  return {
    id: m.serverId ?? 0,
    userId: m.userId,
    title: m.title,
    description: m.description ?? undefined,
    eventDate: m.eventDate,
    eventTime: m.eventTime,
    icon: m.icon ?? undefined,
    iconColor: m.iconColor ?? undefined,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export function useImportantDays() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const queryKey = ['important_days'];

  const { data: importantDays = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const db = getDatabase();
      const records = await db
        .get<ImportantDayModel>('important_days')
        .query(
          Q.and(
            Q.where('is_deleted_locally', false),
            Q.where('user_id', user!.id),
          ),
        )
        .fetch();
      return records.map(modelToDay).sort((a, b) => a.eventDate - b.eventDate);
    },
    enabled: Boolean(user),
  });

  const createImportantDay = useMutation({
    mutationFn: async (payload: Omit<ImportantDay, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const db = getDatabase();
      let localId = '';
      await db.write(async () => {
        const record = await db.get<ImportantDayModel>('important_days').create((m) => {
          m.userId = user!.id;
          m.title = payload.title;
          m.description = payload.description ?? null;
          m.eventDate = payload.eventDate;
          m.eventTime = payload.eventTime;
          m.icon = payload.icon ?? null;
          m.iconColor = payload.iconColor ?? null;
          m.isDirty = true;
          m.isDeletedLocally = false;
          m.serverId = null;
        });
        localId = record.id;
      });
      await SyncQueue.enqueue({
        entity: 'important_days',
        operation: 'create',
        localId,
        payload: {
          title: payload.title,
          description: payload.description ?? null,
          event_date: payload.eventDate,
          event_time: payload.eventTime,
          icon: payload.icon ?? null,
          icon_color: payload.iconColor ?? null,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateImportantDay = useMutation({
    mutationFn: async (payload: Partial<ImportantDay> & { id: number }) => {
      const db = getDatabase();
      const records = await db
        .get<ImportantDayModel>('important_days')
        .query(Q.where('server_id', payload.id))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          if (payload.title !== undefined) m.title = payload.title;
          if (payload.description !== undefined) m.description = payload.description ?? null;
          if (payload.eventDate !== undefined) m.eventDate = payload.eventDate;
          if (payload.eventTime !== undefined) m.eventTime = payload.eventTime;
          if (payload.icon !== undefined) m.icon = payload.icon ?? null;
          if (payload.iconColor !== undefined) m.iconColor = payload.iconColor ?? null;
          m.isDirty = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'important_days',
        operation: 'update',
        localId: record.id,
        serverId: payload.id,
        payload: {
          title: payload.title,
          description: payload.description ?? null,
          event_date: payload.eventDate,
          event_time: payload.eventTime,
          icon: payload.icon ?? null,
          icon_color: payload.iconColor ?? null,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteImportantDay = useMutation({
    mutationFn: async (id: number) => {
      const db = getDatabase();
      const records = await db
        .get<ImportantDayModel>('important_days')
        .query(Q.where('server_id', id))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => { m.isDeletedLocally = true; });
      });
      await SyncQueue.enqueue({
        entity: 'important_days',
        operation: 'delete',
        localId: record.id,
        serverId: id,
        payload: {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { importantDays, isLoading, createImportantDay, updateImportantDay, deleteImportantDay };
}

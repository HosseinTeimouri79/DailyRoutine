import { useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase, DailyTaskModel, SyncQueue, type DailyTask } from '@hadafino/core';
import { useAuthStore } from '../store/authStore';

const TABLE = 'daily_tasks';

function modelToTask(m: DailyTaskModel): DailyTask {
  return {
    id: m.serverId ?? 0,
    userId: m.userId,
    taskDate: m.taskDate,
    content: m.content,
    isDone: m.isDone,
    alarmEnabled: m.alarmEnabled,
    alarmTime: m.alarmTime ?? undefined,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export function useDailyTasks(taskDate: number) {
  const { user } = useAuthStore();
  const queryKey = ['daily_tasks', taskDate];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const db = getDatabase();
      const records = await db
        .get<DailyTaskModel>(TABLE)
        .query(
          Q.and(
            Q.where('task_date', taskDate),
            Q.where('is_deleted_locally', false),
          ),
        )
        .fetch();
      return records.map(modelToTask);
    },
    enabled: Boolean(user),
  });

  const qc = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (payload: { content: string; alarmEnabled: boolean; alarmTime?: string }) => {
      const db = getDatabase();
      const now = Date.now();
      let localId = '';
      await db.write(async () => {
        const record = await db.get<DailyTaskModel>(TABLE).create((m) => {
          m.userId = user!.id;
          m.taskDate = taskDate;
          m.content = payload.content;
          m.isDone = false;
          m.alarmEnabled = payload.alarmEnabled;
          m.alarmTime = payload.alarmTime ?? null;
          m.isDirty = true;
          m.isDeletedLocally = false;
          m.serverId = null;
        });
        localId = record.id;
      });
      await SyncQueue.enqueue({
        entity: 'daily_tasks',
        operation: 'create',
        localId,
        payload: {
          task_date: taskDate,
          content: payload.content,
          is_done: false,
          alarm_enabled: payload.alarmEnabled,
          alarm_time: payload.alarmTime ?? null,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateTask = useMutation({
    mutationFn: async (payload: Partial<DailyTask> & { id: number }) => {
      const db = getDatabase();
      const records = await db
        .get<DailyTaskModel>(TABLE)
        .query(Q.where('server_id', payload.id))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          if (payload.content !== undefined) m.content = payload.content;
          if (payload.isDone !== undefined) m.isDone = payload.isDone;
          if (payload.alarmEnabled !== undefined) m.alarmEnabled = payload.alarmEnabled;
          if (payload.alarmTime !== undefined) m.alarmTime = payload.alarmTime ?? null;
          m.isDirty = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'daily_tasks',
        operation: 'update',
        localId: record.id,
        serverId: record.serverId ?? undefined,
        payload: {
          content: payload.content,
          is_done: payload.isDone,
          alarm_enabled: payload.alarmEnabled,
          alarm_time: payload.alarmTime ?? null,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      const db = getDatabase();
      const records = await db
        .get<DailyTaskModel>(TABLE)
        .query(Q.where('server_id', taskId))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          m.isDeletedLocally = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'daily_tasks',
        operation: 'delete',
        localId: record.id,
        serverId: record.serverId ?? undefined,
        payload: {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const toggleDone = useCallback(
    (task: DailyTask) => updateTask.mutate({ id: task.id, isDone: !task.isDone }),
    [updateTask],
  );

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleDone,
  };
}

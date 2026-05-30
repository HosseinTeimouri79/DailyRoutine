import { Q } from '@nozbe/watermelondb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase, NoteModel, SyncQueue, type Note } from '@hadafino/core';
import { useAuthStore } from '../store/authStore';

function modelToNote(m: NoteModel): Note {
  return {
    id: m.serverId ?? 0,
    userId: m.userId,
    content: m.content,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export function useNotes(searchQuery = '') {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const queryKey = ['notes', searchQuery];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const db = getDatabase();
      const records = await db
        .get<NoteModel>('notes')
        .query(
          Q.and(
            Q.where('is_deleted_locally', false),
            Q.where('user_id', user!.id),
          ),
        )
        .fetch();
      const all = records.map(modelToNote).sort((a, b) => b.updatedAt - a.updatedAt);
      if (!searchQuery.trim()) return all;
      const q = searchQuery.toLowerCase();
      return all.filter((n) => n.content.toLowerCase().includes(q));
    },
    enabled: Boolean(user),
  });

  const createNote = useMutation({
    mutationFn: async (content: string) => {
      const db = getDatabase();
      let localId = '';
      await db.write(async () => {
        const record = await db.get<NoteModel>('notes').create((m) => {
          m.userId = user!.id;
          m.content = content;
          m.isDirty = true;
          m.isDeletedLocally = false;
          m.serverId = null;
        });
        localId = record.id;
      });
      await SyncQueue.enqueue({
        entity: 'notes',
        operation: 'create',
        localId,
        payload: { content },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const db = getDatabase();
      const records = await db
        .get<NoteModel>('notes')
        .query(Q.where('server_id', id))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          m.content = content;
          m.isDirty = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'notes',
        operation: 'update',
        localId: record.id,
        serverId: record.serverId ?? undefined,
        payload: { content },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: number) => {
      const db = getDatabase();
      const records = await db
        .get<NoteModel>('notes')
        .query(Q.where('server_id', id))
        .fetch();
      if (records.length === 0) return;
      const record = records[0];
      await db.write(async () => {
        await record.update((m) => {
          m.isDeletedLocally = true;
        });
      });
      await SyncQueue.enqueue({
        entity: 'notes',
        operation: 'delete',
        localId: record.id,
        serverId: id,
        payload: {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  return { notes, isLoading, createNote, updateNote, deleteNote };
}

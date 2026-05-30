import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Input, Button, IconButton, ConfirmModal, Card } from '@hadafino/ui';
import { formatDateParts, type Note } from '@hadafino/core';
import { useNotes } from '../../src/hooks/useNotes';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { NoteFormModal } from '../../src/features/notes/NoteFormModal';

export default function NotesScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language, calendarType } = useSettingsStore();
  const { showSnackbar } = useUIStore();

  const [search, setSearch] = useState('');
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes(search);

  const [formVisible, setFormVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = useCallback(
    async (content: string) => {
      setFormLoading(true);
      try {
        if (editingNote) {
          await updateNote.mutateAsync({ id: editingNote.id, content });
          showSnackbar(t('notes.noteEdited'), 'success');
        } else {
          await createNote.mutateAsync(content);
          showSnackbar(t('notes.noteCreated'), 'success');
        }
        setFormVisible(false);
        setEditingNote(null);
      } finally {
        setFormLoading(false);
      }
    },
    [editingNote, updateNote, createNote, showSnackbar, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteNote.mutateAsync(deleteTarget.id);
    showSnackbar(t('notes.noteDeleted'), 'info');
    setDeleteTarget(null);
  }, [deleteTarget, deleteNote, showSnackbar, t]);

  const renderItem = useCallback(
    ({ item }: { item: Note }) => {
      const updatedParts = formatDateParts(
        new Date(item.updatedAt).toISOString().slice(0, 10),
        language,
        calendarType,
      );
      return (
        <View
          style={[
            styles.noteCard,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderDefault,
              borderRadius: tokens.radius.md,
            },
          ]}
        >
          <View style={styles.noteActions}>
            <IconButton
              icon="✎"
              label={t('notes.edit')}
              size="sm"
              onPress={() => { setEditingNote(item); setFormVisible(true); }}
            />
            <IconButton
              icon="✕"
              label={t('notes.delete')}
              variant="danger"
              size="sm"
              onPress={() => setDeleteTarget(item)}
            />
          </View>
          <Text
            style={[styles.noteContent, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}
            numberOfLines={5}
          >
            {item.content}
          </Text>
          <Text style={[styles.noteDate, { color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs }]}>
            {updatedParts.fullDate}
          </Text>
        </View>
      );
    },
    [tokens, language, calendarType, t],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      <View style={styles.topBar}>
        <Input
          placeholder={t('notes.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchInput}
          returnKeyType="search"
        />
        <Button
          label={t('notes.add')}
          onPress={() => { setEditingNote(null); setFormVisible(true); }}
          size="sm"
        />
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: tokens.color.textMuted }]}>{t('notes.noNotes')}</Text>
          ) : null
        }
      />

      <NoteFormModal
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingNote(null); }}
        onSubmit={handleSubmit}
        initialContent={editingNote?.content}
        isEditing={Boolean(editingNote)}
        loading={formLoading}
      />

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('notes.confirmDeleteTitle')}
        message={t('notes.confirmDeleteMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 0 },
  searchInput: { flex: 1 },
  list: { padding: 16, gap: 10 },
  noteCard: { padding: 14, borderWidth: 1, gap: 8 },
  noteActions: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end' },
  noteContent: { lineHeight: 22 },
  noteDate: { textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 40 },
});

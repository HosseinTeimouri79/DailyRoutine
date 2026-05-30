import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Button, IconButton, ConfirmModal } from '@hadafino/ui';
import { formatDateParts, timestampToIsoDate, type ImportantDay } from '@hadafino/core';
import { useImportantDays } from '../../src/hooks/useImportantDays';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { ImportantDayFormModal } from '../../src/features/important-days/ImportantDayFormModal';

export default function ImportantDaysScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language, calendarType } = useSettingsStore();
  const { showSnackbar } = useUIStore();

  const { importantDays, isLoading, createImportantDay, updateImportantDay, deleteImportantDay } =
    useImportantDays();

  const [formVisible, setFormVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<ImportantDay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImportantDay | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = useCallback(
    async (data: Parameters<typeof createImportantDay.mutateAsync>[0]) => {
      setFormLoading(true);
      try {
        if (editingDay) {
          await updateImportantDay.mutateAsync({ ...data, id: editingDay.id });
          showSnackbar(t('calendarTab.importantDayEdited'), 'success');
        } else {
          await createImportantDay.mutateAsync(data);
          showSnackbar(t('calendarTab.importantDayCreated'), 'success');
        }
        setFormVisible(false);
        setEditingDay(null);
      } finally {
        setFormLoading(false);
      }
    },
    [editingDay, updateImportantDay, createImportantDay, showSnackbar, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteImportantDay.mutateAsync(deleteTarget.id);
    showSnackbar(t('calendarTab.importantDayDeleted'), 'info');
    setDeleteTarget(null);
  }, [deleteTarget, deleteImportantDay, showSnackbar, t]);

  const renderItem = useCallback(
    ({ item }: { item: ImportantDay }) => {
      const dateParts = formatDateParts(
        timestampToIsoDate(item.eventDate),
        language,
        calendarType,
      );
      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderDefault,
              borderRadius: tokens.radius.md,
            },
          ]}
        >
          <View style={styles.cardLeft}>
            <Text style={[styles.icon, { color: item.iconColor ?? tokens.color.primary }]}>
              {item.icon ?? '⭐'}
            </Text>
            <View style={styles.cardInfo}>
              <Text
                style={[styles.cardTitle, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text
                  style={[styles.cardDesc, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
              <Text style={[styles.cardDate, { color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs }]}>
                {dateParts.fullDate} · {item.eventTime}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="✎"
              label={t('common.edit')}
              size="sm"
              onPress={() => { setEditingDay(item); setFormVisible(true); }}
            />
            <IconButton
              icon="✕"
              label={t('common.delete')}
              variant="danger"
              size="sm"
              onPress={() => setDeleteTarget(item)}
            />
          </View>
        </View>
      );
    },
    [tokens, language, calendarType, t],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.xl }]}>
          {t('calendarTab.importantDaysTitle')}
        </Text>
        <Button
          label={t('calendarTab.add')}
          size="sm"
          onPress={() => { setEditingDay(null); setFormVisible(true); }}
        />
      </View>

      <FlatList
        data={importantDays}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: tokens.color.textMuted }]}>
              {t('calendarTab.noEvents')}
            </Text>
          ) : null
        }
      />

      <ImportantDayFormModal
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingDay(null); }}
        onSubmit={handleSubmit}
        initialData={editingDay ?? undefined}
        isEditing={Boolean(editingDay)}
        loading={formLoading}
      />

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('calendarTab.confirmDeleteTitle')}
        message={t('calendarTab.confirmDeleteMessage')}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1, gap: 12 },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '600' },
  cardDesc: { lineHeight: 20 },
  cardDate: {},
  cardActions: { gap: 6 },
  empty: { textAlign: 'center', marginTop: 40 },
});

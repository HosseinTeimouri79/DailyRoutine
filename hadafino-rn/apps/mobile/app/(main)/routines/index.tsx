import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Card, Button, IconButton, ProgressRing, ConfirmModal } from '@hadafino/ui';
import {
  getTodayISO,
  getWeekStartISO,
  getWeekDays,
  shiftISODate,
  formatDateParts,
  isoDateToTimestamp,
  isAfterToday,
  isRoutineScheduledOnDate,
  type Routine,
  type RoutineLog,
  type RoutineLogStatus,
} from '@hadafino/core';
import { useRoutines, useRoutineLogs } from '../../src/hooks/useRoutines';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { RoutineFormModal } from '../../src/features/routines/RoutineFormModal';

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function buildLogsMap(logs: RoutineLog[]): Map<string, RoutineLogStatus> {
  const map = new Map<string, RoutineLogStatus>();
  for (const log of logs) {
    map.set(`${log.routineId}:${log.date}`, log.status);
  }
  return map;
}

const RoutineRow = memo(function RoutineRow({
  routine,
  weekDays,
  logsMap,
  onToggle,
  onEdit,
  onDelete,
  tokens,
  t,
  language,
  calendarType,
}: {
  routine: Routine;
  weekDays: string[];
  logsMap: Map<string, RoutineLogStatus>;
  onToggle: (routine: Routine, isoDate: string) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
  tokens: ReturnType<typeof useTheme>['tokens'];
  t: (k: string) => string;
  language: string;
  calendarType: string;
}): React.JSX.Element {
  const done = weekDays.filter((d) => logsMap.get(`${routine.id}:${isoDateToTimestamp(d)}`) === 'done').length;
  const scheduled = weekDays.filter((d) => isRoutineScheduledOnDate(routine, d)).length;
  const percent = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

  return (
    <View
      style={[
        styles.routineRow,
        {
          backgroundColor: tokens.color.bgSurface,
          borderColor: tokens.color.borderDefault,
          borderRadius: tokens.radius.md,
        },
      ]}
    >
      <View style={styles.routineHeader}>
        <View style={[styles.colorDot, { backgroundColor: routine.color ?? tokens.color.primary }]} />
        <Text
          style={[styles.routineTitle, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}
          numberOfLines={1}
        >
          {routine.title}
        </Text>
        <ProgressRing value={percent} size={36} strokeWidth={4} color={routine.color ?? tokens.color.primary} />
        <IconButton icon="✎" label={t('common.edit')} onPress={() => onEdit(routine)} size="sm" />
        <IconButton icon="✕" label={t('common.delete')} variant="danger" onPress={() => onDelete(routine)} size="sm" />
      </View>

      <View style={styles.dayRow}>
        {weekDays.map((isoDate, idx) => {
          const ts = isoDateToTimestamp(isoDate);
          const status = logsMap.get(`${routine.id}:${ts}`);
          const scheduled = isRoutineScheduledOnDate(routine, isoDate);
          const isFuture = isAfterToday(isoDate);
          const dayParts = formatDateParts(isoDate, language, calendarType as 'jalali' | 'gregorian');

          return (
            <View key={isoDate} style={styles.dayCell}>
              <Text style={[styles.dayLabel, { color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs }]}>
                {t(`weekly.weekdaysShort.${WEEKDAY_KEYS[idx]}`)}
              </Text>
              <View
                style={[
                  styles.dayBubble,
                  {
                    backgroundColor: !scheduled
                      ? 'transparent'
                      : status === 'done'
                        ? tokens.color.success
                        : status === 'missed'
                          ? tokens.color.dangerSoft
                          : tokens.color.bgControl,
                    borderColor: scheduled ? tokens.color.borderDefault : 'transparent',
                    borderRadius: tokens.radius.full,
                    opacity: isFuture ? 0.4 : 1,
                  },
                ]}
              >
                {scheduled && (
                  <Text
                    style={{
                      color: status === 'done' ? '#fff' : tokens.color.textMuted,
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: '700',
                    }}
                    onPress={() => !isFuture && scheduled && onToggle(routine, isoDate)}
                  >
                    {status === 'done' ? '✓' : status === 'missed' ? '✕' : '·'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

export default function RoutinesScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language, calendarType } = useSettingsStore();
  const { showSnackbar } = useUIStore();

  const today = getTodayISO();
  const [weekStart, setWeekStart] = useState(() => getWeekStartISO(today));
  const weekDays = getWeekDays(weekStart);

  const startTs = isoDateToTimestamp(weekDays[0]);
  const endTs = isoDateToTimestamp(weekDays[6]);

  const { routines, isLoading, createRoutine, deleteRoutine } = useRoutines();
  const { logs, upsertLog } = useRoutineLogs(startTs, endTs);
  const logsMap = buildLogsMap(logs);

  const [formVisible, setFormVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleToggle = useCallback(
    (routine: Routine, isoDate: string) => {
      if (isAfterToday(isoDate)) {
        showSnackbar(t('weekly.cannotSetFuture'), 'warn');
        return;
      }
      const ts = isoDateToTimestamp(isoDate);
      const current = logsMap.get(`${routine.id}:${ts}`);
      const nextStatus: RoutineLogStatus = current === 'done' ? 'missed' : 'done';
      upsertLog.mutate({
        routineLocalId: String(routine.id),
        routineServerId: routine.id,
        date: ts,
        status: nextStatus,
      });
    },
    [logsMap, upsertLog, showSnackbar, t],
  );

  const handleSubmitForm = useCallback(
    async (data: Parameters<typeof createRoutine.mutateAsync>[0]) => {
      setFormLoading(true);
      try {
        await createRoutine.mutateAsync(data);
        showSnackbar(t('notifications.routineCreated'), 'success');
        setFormVisible(false);
      } finally {
        setFormLoading(false);
      }
    },
    [createRoutine, showSnackbar, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteRoutine.mutateAsync(deleteTarget.id);
    showSnackbar(t('notifications.routineDeleted'), 'info');
    setDeleteTarget(null);
  }, [deleteTarget, deleteRoutine, showSnackbar, t]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      {/* Week navigation */}
      <View style={[styles.weekNav, { backgroundColor: tokens.color.bgSurface, borderBottomColor: tokens.color.borderDefault }]}>
        <IconButton icon="◀" label={t('weekly.previousWeek')} onPress={() => setWeekStart(shiftISODate(weekStart, -7))} size="sm" />
        <Text style={[styles.weekLabel, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.sm }]}>
          {formatDateParts(weekDays[0], language, calendarType).day} – {formatDateParts(weekDays[6], language, calendarType).day}
        </Text>
        <IconButton icon="▶" label={t('weekly.nextWeek')} onPress={() => setWeekStart(shiftISODate(weekStart, 7))} size="sm" />
        <Button label={t('weekly.add')} size="sm" onPress={() => { setEditingRoutine(null); setFormVisible(true); }} />
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RoutineRow
            routine={item}
            weekDays={weekDays}
            logsMap={logsMap}
            onToggle={handleToggle}
            onEdit={(r) => { setEditingRoutine(r); setFormVisible(true); }}
            onDelete={setDeleteTarget}
            tokens={tokens}
            t={t}
            language={language}
            calendarType={calendarType}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: tokens.color.textMuted }]}>{t('weekly.noRoutines')}</Text>
          ) : null
        }
      />

      <RoutineFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmitForm}
        initialData={editingRoutine ?? undefined}
        isEditing={Boolean(editingRoutine)}
        loading={formLoading}
      />

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('weekly.confirmDeleteTitle')}
        message={t('weekly.confirmDeleteMessage').replace('{{title}}', deleteTarget?.title ?? '')}
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  weekLabel: { flex: 1, textAlign: 'center', fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  routineRow: { padding: 12, borderWidth: 1, gap: 10 },
  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  routineTitle: { flex: 1, fontWeight: '600' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4, flex: 1 },
  dayLabel: { fontWeight: '500' },
  dayBubble: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Button, Card, Checkbox, IconButton, ConfirmModal } from '@hadafino/ui';
import {
  getTodayISO,
  formatDateParts,
  formatMonthYear,
  getMonthCursorFromISO,
  getGregorianDatesForCalendarMonth,
  shiftMonthCursor,
  isoDateToTimestamp,
} from '@hadafino/core';
import { useDailyTasks } from '../../src/hooks/useDailyTasks';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { TaskFormModal } from '../../src/features/tasks/TaskFormModal';
import type { DailyTask } from '@hadafino/core';

const ITEM_HEIGHT = 56;

interface TaskItemProps {
  task: DailyTask;
  onToggle: (task: DailyTask) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (task: DailyTask) => void;
  language: string;
  t: (key: string) => string;
  tokens: ReturnType<typeof useTheme>['tokens'];
}

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  language,
  t,
  tokens,
}: TaskItemProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.taskItem,
        {
          backgroundColor: tokens.color.bgSurfaceSoft,
          borderColor: tokens.color.borderSoft,
          borderRadius: tokens.radius.md,
        },
      ]}
    >
      <IconButton
        icon="✎"
        label={t('dailyTasks.editTask')}
        onPress={() => onEdit(task)}
        size="sm"
      />
      <IconButton
        icon="✕"
        label={t('dailyTasks.deleteTask')}
        variant="danger"
        size="sm"
        onPress={() => onDelete(task)}
      />
      <Checkbox
        checked={task.isDone}
        onChange={() => onToggle(task)}
        accessibilityLabel={task.isDone ? t('dailyTasks.markUndone') : t('dailyTasks.markDone')}
      />
      <Text
        style={[
          styles.taskContent,
          {
            color: task.isDone ? tokens.color.textMuted : tokens.color.textPrimary,
            fontSize: tokens.typography.fontSize.base,
            textDecorationLine: task.isDone ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={3}
      >
        {task.content}
      </Text>
      {task.alarmEnabled && task.alarmTime && (
        <Text
          style={[styles.alarmBadge, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.xs }]}
        >
          ⏰ {task.alarmTime}
        </Text>
      )}
    </View>
  );
});

export default function DailyTasksScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language, calendarType } = useSettingsStore();
  const { selectedDate, setSelectedDate, showSnackbar } = useUIStore();

  const taskDateTimestamp = isoDateToTimestamp(selectedDate);
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleDone } =
    useDailyTasks(taskDateTimestamp);

  const [monthCursor, setMonthCursor] = useState(() => getMonthCursorFromISO(selectedDate));
  const calendarDays = getGregorianDatesForCalendarMonth(monthCursor);

  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyTask | null>(null);

  const dateParts = formatDateParts(selectedDate, language, calendarType);
  const monthLabel = formatMonthYear(monthCursor, language, calendarType);

  const handleOpenAdd = useCallback(() => {
    setEditingTask(null);
    setTaskFormVisible(true);
  }, []);

  const handleOpenEdit = useCallback((task: DailyTask) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  }, []);

  const handleSubmitTask = useCallback(
    async (data: { content: string; alarmEnabled: boolean; alarmTime?: string }) => {
      if (editingTask) {
        await updateTask.mutateAsync({ ...data, id: editingTask.id });
        showSnackbar(t('notifications.taskEdited'), 'success');
      } else {
        await createTask.mutateAsync(data);
        showSnackbar(t('notifications.taskCreated'), 'success');
      }
      setTaskFormVisible(false);
    },
    [editingTask, updateTask, createTask, showSnackbar, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteTask.mutateAsync(deleteTarget.id);
    showSnackbar(t('notifications.taskDeleted'), 'info');
    setDeleteTarget(null);
  }, [deleteTarget, deleteTask, showSnackbar, t]);

  const handleToggle = useCallback(
    (task: DailyTask) => toggleDone(task),
    [toggleDone],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar picker */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderDefault,
              borderRadius: tokens.radius.lg,
            },
          ]}
        >
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <IconButton
              icon="◀"
              label={t('weekly.previousWeek')}
              onPress={() => setMonthCursor(shiftMonthCursor(monthCursor, -1))}
              size="sm"
            />
            <Text
              style={[styles.monthLabel, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}
            >
              {monthLabel}
            </Text>
            <IconButton
              icon="▶"
              label={t('weekly.nextWeek')}
              onPress={() => setMonthCursor(shiftMonthCursor(monthCursor, 1))}
              size="sm"
            />
          </View>

          {/* Day grid — 7 columns */}
          <View style={styles.dayGrid}>
            {calendarDays.map((day) => {
              const isSelected = day === selectedDate;
              const isToday = day === getTodayISO();
              const isCurrentMonth = day.startsWith(monthCursor);
              return (
                <Pressable
                  key={day}
                  onPress={() => {
                    setSelectedDate(day);
                    setMonthCursor(getMonthCursorFromISO(day));
                  }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected
                        ? tokens.color.primary
                        : isToday
                          ? tokens.color.primarySoft
                          : 'transparent',
                      borderRadius: tokens.radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#fff'
                        : isCurrentMonth
                          ? tokens.color.textPrimary
                          : tokens.color.textMuted,
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: isSelected || isToday ? '700' : '400',
                    }}
                  >
                    {formatDateParts(day, language, calendarType).day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Selected date label */}
          <Text style={[styles.selectedLabel, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {dateParts.dayName}، {dateParts.fullDate}
          </Text>
        </View>

        {/* Tasks list */}
        <Card
          title={t('dailyTasks.title')}
          subtitle={t('dailyTasks.subtitle')}
          headerRight={
            <Button label={t('dailyTasks.add')} onPress={handleOpenAdd} size="sm" />
          }
        >
          {isLoading ? (
            <Text style={{ color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.sm, paddingVertical: 16 }}>
              {t('dailyTasks.loading')}
            </Text>
          ) : tasks.length === 0 ? (
            <Text style={{ color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.sm, paddingVertical: 16 }}>
              {t('dailyTasks.noTasks')}
            </Text>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                  language={language}
                  t={t}
                  tokens={tokens}
                />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <TaskFormModal
        visible={taskFormVisible}
        onClose={() => setTaskFormVisible(false)}
        onSubmit={handleSubmitTask}
        initialData={editingTask ?? undefined}
        isEditing={Boolean(editingTask)}
        loading={createTask.isPending || updateTask.isPending}
      />

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('dailyTasks.confirmDeleteTitle')}
        message={t('dailyTasks.confirmDeleteMessage').replace('{{content}}', deleteTarget?.content ?? '')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteTask.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  calendarCard: { padding: 16, borderWidth: 1, gap: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontWeight: '600' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLabel: { textAlign: 'center', marginTop: 4 },
  taskList: { gap: 8, marginTop: 8 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    gap: 8,
    minHeight: ITEM_HEIGHT,
  },
  taskContent: { flex: 1 },
  alarmBadge: { marginLeft: 4 },
});

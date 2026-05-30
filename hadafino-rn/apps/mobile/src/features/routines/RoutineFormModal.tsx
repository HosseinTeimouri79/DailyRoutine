import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Modal, Input, Button, Checkbox, TimePicker, Dropdown, type DropdownOption } from '@hadafino/ui';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import {
  RECURRENCE_MODES,
  normalizeRoutineRecurrence,
  type Routine,
  type RecurrenceMode,
} from '@hadafino/core';
import { useSettingsStore } from '../../store/settingsStore';

interface RoutineFormData {
  title: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  recurrenceMode: RecurrenceMode;
  recurrenceWeekdays: number[];
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  alarmEnabled: boolean;
  alarmTime?: string;
}

interface RoutineFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RoutineFormData) => Promise<void>;
  initialData?: Routine;
  isEditing?: boolean;
  loading?: boolean;
}

const COLORS = ['#375dfb', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e91e63'];

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function WeekdaySelector({
  selected,
  onChange,
  tokens,
  t,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
  tokens: ReturnType<typeof useTheme>['tokens'];
  t: (k: string) => string;
}): React.JSX.Element {
  const toggle = (idx: number) => {
    onChange(selected.includes(idx) ? selected.filter((d) => d !== idx) : [...selected, idx]);
  };

  return (
    <View style={wdStyles.row}>
      {WEEKDAY_KEYS.map((key, idx) => {
        const active = selected.includes(idx);
        return (
          <Pressable
            key={key}
            onPress={() => toggle(idx)}
            style={[
              wdStyles.chip,
              {
                backgroundColor: active ? tokens.color.primary : tokens.color.bgControl,
                borderColor: active ? tokens.color.primary : tokens.color.borderDefault,
                borderRadius: tokens.radius.full,
              },
            ]}
          >
            <Text
              style={{
                color: active ? '#fff' : tokens.color.textSecondary,
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: '600',
              }}
            >
              {t(`weekly.weekdaysShort.${key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const wdStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
});

export const RoutineFormModal = memo(function RoutineFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: RoutineFormModalProps): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>(RECURRENCE_MODES.SPECIFIC_WEEKDAYS);
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('08:00');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const norm = normalizeRoutineRecurrence(initialData);
        setTitle(initialData.title);
        setColor(initialData.color ?? COLORS[0]);
        setRecurrenceMode(norm.mode);
        setWeekdays(norm.weekdays);
        setDayOfWeek(norm.dayOfWeek ?? 0);
        setDayOfMonth(norm.dayOfMonth ?? 1);
        setAlarmEnabled(initialData.alarmEnabled);
        setAlarmTime(initialData.alarmTime ?? '08:00');
      } else {
        setTitle('');
        setColor(COLORS[0]);
        setRecurrenceMode(RECURRENCE_MODES.SPECIFIC_WEEKDAYS);
        setWeekdays([0, 1, 2, 3, 4, 5, 6]);
        setDayOfWeek(0);
        setDayOfMonth(1);
        setAlarmEnabled(false);
        setAlarmTime('08:00');
      }
    }
  }, [visible, initialData]);

  const recurrenceModeOptions: DropdownOption<RecurrenceMode>[] = [
    { value: RECURRENCE_MODES.SPECIFIC_WEEKDAYS, label: t('weekly.recurrenceSpecificWeekdays') },
    { value: RECURRENCE_MODES.WEEKLY_DAY, label: t('weekly.recurrenceWeeklyDay') },
    { value: RECURRENCE_MODES.MONTHLY_DAY, label: t('weekly.recurrenceMonthlyDay') },
  ];

  const dayOfWeekOptions: DropdownOption<string>[] = WEEKDAY_KEYS.map((k, i) => ({
    value: String(i),
    label: t(`weekly.weekdays.${k}`),
  }));

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      color,
      isActive: true,
      recurrenceMode,
      recurrenceWeekdays: recurrenceMode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS ? weekdays : [],
      recurrenceDayOfWeek: recurrenceMode === RECURRENCE_MODES.WEEKLY_DAY ? dayOfWeek : undefined,
      recurrenceDayOfMonth: recurrenceMode === RECURRENCE_MODES.MONTHLY_DAY ? dayOfMonth : undefined,
      alarmEnabled,
      alarmTime: alarmEnabled ? alarmTime : undefined,
    });
  }, [title, color, recurrenceMode, weekdays, dayOfWeek, dayOfMonth, alarmEnabled, alarmTime, onSubmit]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('weekly.editRoutine') : t('weekly.addRoutine')}
    >
      <View style={styles.form}>
        <Input
          label={t('weekly.routineNamePlaceholder')}
          placeholder={t('weekly.routineNamePlaceholder')}
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
        />

        {/* Color picker */}
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                color === c && { borderWidth: 3, borderColor: tokens.color.textPrimary },
              ]}
            />
          ))}
        </View>

        <Dropdown
          label={t('weekly.recurrenceMode')}
          options={recurrenceModeOptions}
          value={recurrenceMode}
          onChange={setRecurrenceMode}
        />

        {recurrenceMode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
              {t('weekly.recurrenceDaysOfWeek')}
            </Text>
            <WeekdaySelector
              selected={weekdays}
              onChange={setWeekdays}
              tokens={tokens}
              t={t}
            />
          </View>
        )}

        {recurrenceMode === RECURRENCE_MODES.WEEKLY_DAY && (
          <Dropdown
            label={t('weekly.recurrenceDayOfWeek')}
            options={dayOfWeekOptions}
            value={String(dayOfWeek)}
            onChange={(v) => setDayOfWeek(Number(v))}
          />
        )}

        {recurrenceMode === RECURRENCE_MODES.MONTHLY_DAY && (
          <Input
            label={t('weekly.recurrenceDayOfMonth')}
            value={String(dayOfMonth)}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1 && n <= 31) setDayOfMonth(n);
            }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        )}

        <Checkbox
          checked={alarmEnabled}
          onChange={setAlarmEnabled}
          label={t('weekly.enableAlarm')}
        />
        {alarmEnabled && (
          <TimePicker
            value={alarmTime}
            onChange={setAlarmTime}
            label={t('common.alarmTime')}
          />
        )}

        <View style={styles.actions}>
          <Button label={t('common.cancel')} variant="secondary" onPress={onClose} style={styles.btn} />
          <Button
            label={isEditing ? t('weekly.saveChanges') : t('weekly.create')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!title.trim()}
            style={styles.btn}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  form: { gap: 14 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  field: { gap: 6 },
  fieldLabel: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, alignSelf: 'stretch' },
});

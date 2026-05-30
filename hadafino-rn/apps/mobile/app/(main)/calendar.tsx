import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { IconButton } from '@hadafino/ui';
import {
  getTodayISO,
  getGregorianDatesForCalendarMonth,
  getMonthCursorFromISO,
  shiftMonthCursor,
  formatMonthYear,
  formatDayNumber,
  isoDateToTimestamp,
  isToday,
  isRoutineScheduledOnDate,
  type Routine,
  type RoutineLog,
  type RoutineLogStatus,
  type ImportantDay,
  type DailyTask,
} from '@hadafino/core';
import { useRoutines, useRoutineLogs } from '../../src/hooks/useRoutines';
import { useImportantDays } from '../../src/hooks/useImportantDays';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface DayStats {
  done: number;
  missed: number;
  total: number;
  hasImportantDay: boolean;
}

function buildDayStats(
  isoDate: string,
  routines: Routine[],
  logsMap: Map<string, RoutineLogStatus>,
  importantDays: ImportantDay[],
): DayStats {
  const ts = isoDateToTimestamp(isoDate);
  const scheduled = routines.filter((r) => r.isActive && isRoutineScheduledOnDate(r, isoDate));
  const done = scheduled.filter((r) => logsMap.get(`${r.id}:${ts}`) === 'done').length;
  const missed = scheduled.filter((r) => logsMap.get(`${r.id}:${ts}`) === 'missed').length;
  const hasImportantDay = importantDays.some((d) => {
    const dayISO = new Date(d.eventDate).toISOString().slice(0, 10);
    return dayISO === isoDate;
  });
  return { done, missed, total: scheduled.length, hasImportantDay };
}

export default function CalendarScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const { language, calendarType } = useSettingsStore();
  const { selectedDate, setSelectedDate } = useUIStore();

  const [monthCursor, setMonthCursor] = useState(() => getMonthCursorFromISO(selectedDate));
  const calendarDays = getGregorianDatesForCalendarMonth(monthCursor);
  const monthLabel = formatMonthYear(monthCursor, language, calendarType);

  const startTs = isoDateToTimestamp(`${monthCursor}-01`);
  const endTs = isoDateToTimestamp(
    `${monthCursor}-${new Date(Number(monthCursor.split('-')[0]), Number(monthCursor.split('-')[1]), 0).getDate()}`,
  );

  const { routines } = useRoutines();
  const { logs } = useRoutineLogs(startTs, endTs);
  const { importantDays } = useImportantDays();

  const logsMap = useMemo(() => {
    const map = new Map<string, RoutineLogStatus>();
    for (const log of logs) {
      map.set(`${log.routineId}:${log.date}`, log.status);
    }
    return map;
  }, [logs]);

  const dayStatsMap = useMemo(() => {
    const map = new Map<string, DayStats>();
    for (const isoDate of calendarDays) {
      map.set(isoDate, buildDayStats(isoDate, routines, logsMap, importantDays));
    }
    return map;
  }, [calendarDays, routines, logsMap, importantDays]);

  const selectedDayImportantDays = useMemo(
    () =>
      importantDays.filter((d) => {
        const dayISO = new Date(d.eventDate).toISOString().slice(0, 10);
        return dayISO === selectedDate;
      }),
    [importantDays, selectedDate],
  );

  const handleDayPress = useCallback(
    (isoDate: string) => setSelectedDate(isoDate),
    [setSelectedDate],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <IconButton
            icon="◀"
            label="Previous month"
            size="sm"
            onPress={() => setMonthCursor(shiftMonthCursor(monthCursor, -1))}
          />
          <Text style={[styles.monthLabel, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.lg }]}>
            {monthLabel}
          </Text>
          <IconButton
            icon="▶"
            label="Next month"
            size="sm"
            onPress={() => setMonthCursor(shiftMonthCursor(monthCursor, 1))}
          />
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_KEYS.map((k) => (
            <Text
              key={k}
              style={[styles.weekdayLabel, { color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs }]}
            >
              {t(`weekly.weekdaysShort.${k}`)}
            </Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {calendarDays.map((isoDate) => {
            const isCurrentMonth = isoDate.startsWith(monthCursor);
            const isSelected = isoDate === selectedDate;
            const todayFlag = isToday(isoDate);
            const stats = dayStatsMap.get(isoDate);
            const dayNum = formatDayNumber(isoDate, language, calendarType);
            const hasActivity = (stats?.total ?? 0) > 0;
            const allDone = hasActivity && stats!.done === stats!.total;

            return (
              <Pressable
                key={isoDate}
                onPress={() => handleDayPress(isoDate)}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected
                      ? tokens.color.primary
                      : todayFlag
                        ? tokens.color.primarySoft
                        : 'transparent',
                    borderRadius: tokens.radius.sm,
                    opacity: isCurrentMonth ? 1 : 0.3,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected
                        ? '#fff'
                        : todayFlag
                          ? tokens.color.primary
                          : tokens.color.textPrimary,
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: todayFlag || isSelected ? '700' : '400',
                    },
                  ]}
                >
                  {dayNum}
                </Text>
                {/* Dots */}
                <View style={styles.dots}>
                  {hasActivity && (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: allDone
                            ? tokens.color.success
                            : tokens.color.warn,
                        },
                      ]}
                    />
                  )}
                  {stats?.hasImportantDay && (
                    <View style={[styles.dot, { backgroundColor: tokens.color.accent }]} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Selected day detail */}
        {selectedDayImportantDays.length > 0 && (
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: tokens.color.bgSurface,
                borderColor: tokens.color.borderDefault,
                borderRadius: tokens.radius.lg,
              },
            ]}
          >
            <Text style={[styles.detailTitle, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}>
              {t('calendarTab.selectedDate')}
            </Text>
            {selectedDayImportantDays.map((d) => (
              <View key={d.id} style={styles.eventRow}>
                <Text style={{ fontSize: 18, color: d.iconColor ?? tokens.color.primary }}>
                  {d.icon ?? '⭐'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.sm, fontWeight: '600' }]}>
                    {d.title}
                  </Text>
                  {d.description && (
                    <Text style={[{ color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.xs }]}>
                      {d.description}
                    </Text>
                  )}
                </View>
                <Text style={[{ color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs }]}>
                  {d.eventTime}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontWeight: '700' },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayNum: { textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  detailCard: { padding: 14, borderWidth: 1, gap: 10 },
  detailTitle: { fontWeight: '700' },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});

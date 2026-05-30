import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Modal, Input, Button, TimePicker } from '@hadafino/ui';
import { useTranslation } from '@hadafino/i18n';
import { useTheme } from '@hadafino/theme';
import { isoDateToTimestamp, timestampToIsoDate, type ImportantDay } from '@hadafino/core';

interface ImportantDayFormData {
  title: string;
  description?: string;
  eventDate: number;
  eventTime: string;
  icon?: string;
  iconColor?: string;
}

interface ImportantDayFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ImportantDayFormData) => Promise<void>;
  initialData?: ImportantDay;
  isEditing?: boolean;
  loading?: boolean;
}

const ICON_OPTIONS = ['⭐', '🎂', '💍', '🏆', '❤️', '🎉', '📅', '🔔', '🌟', '🎯'];
const COLOR_OPTIONS = ['#375dfb', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#e91e63', '#ff6b35'];

export const ImportantDayFormModal = memo(function ImportantDayFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: ImportantDayFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDateISO, setEventDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('09:00');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [iconColor, setIconColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description ?? '');
        setEventDateISO(timestampToIsoDate(initialData.eventDate));
        setEventTime(initialData.eventTime);
        setIcon(initialData.icon ?? ICON_OPTIONS[0]);
        setIconColor(initialData.iconColor ?? COLOR_OPTIONS[0]);
      } else {
        setTitle('');
        setDescription('');
        setEventDateISO(new Date().toISOString().slice(0, 10));
        setEventTime('09:00');
        setIcon(ICON_OPTIONS[0]);
        setIconColor(COLOR_OPTIONS[0]);
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate: isoDateToTimestamp(eventDateISO),
      eventTime,
      icon,
      iconColor,
    });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('calendarTab.editImportantDay') : t('calendarTab.addImportantDay')}
    >
      <View style={styles.form}>
        <Input
          label={t('calendarTab.importantDayTitle')}
          placeholder={t('calendarTab.importantDayTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
        />
        <Input
          label={t('calendarTab.importantDayDescription')}
          placeholder={t('calendarTab.importantDayDescriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
        />
        <Input
          label={t('calendarTab.importantDayDate')}
          placeholder="YYYY-MM-DD"
          value={eventDateISO}
          onChangeText={setEventDateISO}
          keyboardType="numbers-and-punctuation"
        />
        <TimePicker
          value={eventTime}
          onChange={setEventTime}
          label={t('calendarTab.importantDayTime')}
        />

        {/* Icon picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('calendarTab.importantDayIconSelect')}
          </Text>
          <View style={styles.iconRow}>
            {ICON_OPTIONS.map((ic) => (
              <View
                key={ic}
                style={[
                  styles.iconChip,
                  {
                    backgroundColor: icon === ic ? tokens.color.primarySoft : tokens.color.bgControl,
                    borderColor: icon === ic ? tokens.color.primary : tokens.color.borderDefault,
                    borderRadius: tokens.radius.sm,
                  },
                ]}
              >
                <Text
                  style={{ fontSize: 20 }}
                  onPress={() => setIcon(ic)}
                >
                  {ic}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('calendarTab.importantDayIconColor')}
          </Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <View
                key={c}
                onTouchEnd={() => setIconColor(c)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderWidth: iconColor === c ? 3 : 1,
                    borderColor: iconColor === c ? tokens.color.textPrimary : 'transparent',
                    borderRadius: tokens.radius.full,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button label={t('common.cancel')} variant="secondary" onPress={onClose} style={styles.btn} />
          <Button
            label={isEditing ? t('common.save') : t('calendarTab.createImportantDay')}
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
  section: { gap: 8 },
  sectionLabel: { fontWeight: '600' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: { padding: 8, borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, alignSelf: 'stretch' },
});

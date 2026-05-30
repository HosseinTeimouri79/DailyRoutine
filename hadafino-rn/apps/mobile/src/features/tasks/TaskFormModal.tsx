import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Input, Button, Checkbox, TimePicker } from '@hadafino/ui';
import { useTranslation } from '@hadafino/i18n';
import type { DailyTask } from '@hadafino/core';

interface TaskFormData {
  content: string;
  alarmEnabled: boolean;
  alarmTime?: string;
}

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: DailyTask;
  isEditing?: boolean;
  loading?: boolean;
}

export const TaskFormModal = memo(function TaskFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: TaskFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('08:00');

  useEffect(() => {
    if (visible) {
      setContent(initialData?.content ?? '');
      setAlarmEnabled(initialData?.alarmEnabled ?? false);
      setAlarmTime(initialData?.alarmTime ?? '08:00');
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit({
      content: content.trim(),
      alarmEnabled,
      alarmTime: alarmEnabled ? alarmTime : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('dailyTasks.editTask') : t('dailyTasks.add')}
    >
      <View style={styles.form}>
        <Input
          placeholder={t('dailyTasks.taskPlaceholder')}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={3}
          returnKeyType="default"
        />
        <Checkbox
          checked={alarmEnabled}
          onChange={setAlarmEnabled}
          label={t('dailyTasks.enableAlarm')}
        />
        {alarmEnabled && (
          <TimePicker
            value={alarmTime}
            onChange={setAlarmTime}
            label={t('common.alarmTime')}
          />
        )}
        <View style={styles.actions}>
          <Button
            label={t('common.cancel')}
            variant="secondary"
            onPress={onClose}
            style={styles.btn}
          />
          <Button
            label={isEditing ? t('dailyTasks.saveChanges') : t('dailyTasks.create')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!content.trim()}
            style={styles.btn}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  form: { gap: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, alignSelf: 'stretch' },
});

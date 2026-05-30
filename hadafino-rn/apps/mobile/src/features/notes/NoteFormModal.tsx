import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Button, Input } from '@hadafino/ui';
import { useTranslation } from '@hadafino/i18n';

interface NoteFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  initialContent?: string;
  isEditing?: boolean;
  loading?: boolean;
}

export const NoteFormModal = memo(function NoteFormModal({
  visible,
  onClose,
  onSubmit,
  initialContent,
  isEditing = false,
  loading = false,
}: NoteFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible) setContent(initialContent ?? '');
  }, [visible, initialContent]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content.trim());
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('notes.editNote') : t('notes.addNote')}
    >
      <View style={styles.form}>
        <Input
          placeholder={t('notes.notePlaceholder')}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={styles.textarea}
        />
        <View style={styles.actions}>
          <Button label={t('common.cancel')} variant="secondary" onPress={onClose} style={styles.btn} />
          <Button
            label={isEditing ? t('common.save') : t('notes.create')}
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
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignSelf: 'stretch' },
});

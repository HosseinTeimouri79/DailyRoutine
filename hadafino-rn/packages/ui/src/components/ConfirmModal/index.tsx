import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { useTheme } from '@hadafino/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmModal = memo(function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
  loading = false,
}: ConfirmModalProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <Modal visible={visible} onClose={onCancel} title={title} scrollable={false}>
      <View style={styles.root}>
        <Text
          style={[
            styles.message,
            {
              color: tokens.color.textSecondary,
              fontSize: tokens.typography.fontSize.base,
            },
          ]}
        >
          {message}
        </Text>

        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            variant="secondary"
            onPress={onCancel}
            style={styles.button}
          />
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  button: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

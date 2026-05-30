import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { useTheme } from '@hadafino/theme';

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (time: string) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  defaultFormat?: '12' | '24';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseTime(value: string): { hours: number; minutes: number } {
  const [h, m] = value.split(':').map(Number);
  return {
    hours: Number.isNaN(h) ? 0 : h,
    minutes: Number.isNaN(m) ? 0 : m,
  };
}

export const TimePicker = memo(function TimePicker({
  value,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  defaultFormat = '24',
}: TimePickerProps): React.JSX.Element {
  const { tokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<'12' | '24'>(defaultFormat);
  const { hours, minutes } = parseTime(value);
  const [localHours, setLocalHours] = useState(hours);
  const [localMinutes, setLocalMinutes] = useState(minutes);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(hours >= 12 ? 'PM' : 'AM');

  const handleOpen = useCallback(() => {
    if (disabled) return;
    const parsed = parseTime(value);
    setLocalHours(parsed.hours);
    setLocalMinutes(parsed.minutes);
    setMeridiem(parsed.hours >= 12 ? 'PM' : 'AM');
    setIsOpen(true);
  }, [disabled, value]);

  const handleConfirm = useCallback(() => {
    let finalHours = localHours;
    if (format === '12') {
      if (meridiem === 'PM' && finalHours < 12) finalHours += 12;
      if (meridiem === 'AM' && finalHours === 12) finalHours = 0;
    }
    onChange(`${pad(finalHours)}:${pad(localMinutes)}`);
    setIsOpen(false);
  }, [format, localHours, localMinutes, meridiem, onChange]);

  const displayValue = value || '--:--';

  const spinnerNumbers = (
    max: number,
    current: number,
    setCurrent: (n: number) => void,
  ): React.JSX.Element => (
    <View style={styles.spinner}>
      <Pressable
        onPress={() => setCurrent((current - 1 + max) % max)}
        style={styles.spinnerBtn}
      >
        <Text style={[styles.spinnerArrow, { color: tokens.color.textSecondary }]}>▲</Text>
      </Pressable>
      <Text
        style={[
          styles.spinnerValue,
          { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize['2xl'] },
        ]}
      >
        {pad(current)}
      </Text>
      <Pressable
        onPress={() => setCurrent((current + 1) % max)}
        style={styles.spinnerBtn}
      >
        <Text style={[styles.spinnerArrow, { color: tokens.color.textSecondary }]}>▼</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: tokens.color.borderDefault,
            backgroundColor: disabled ? tokens.color.bgControl : tokens.color.bgControl,
            borderRadius: tokens.radius.md,
            opacity: pressed || disabled ? 0.7 : 1,
          },
        ]}
        disabled={disabled}
        accessibilityLabel={ariaLabel ?? label ?? 'Time picker'}
        accessibilityRole="button"
      >
        {label && (
          <Text
            style={[styles.label, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}
          >
            {label}
          </Text>
        )}
        <Text style={[styles.value, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.base }]}>
          {displayValue}
        </Text>
      </Pressable>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)} title="Select Time" scrollable={false}>
        <View style={styles.modalContent}>
          <View style={styles.formatRow}>
            {(['12', '24'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFormat(f)}
                style={[
                  styles.formatBtn,
                  {
                    backgroundColor: format === f ? tokens.color.primary : tokens.color.bgControl,
                    borderRadius: tokens.radius.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    color: format === f ? '#fff' : tokens.color.textSecondary,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: '600',
                  }}
                >
                  {f}h
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.pickersRow}>
            {spinnerNumbers(format === '12' ? 12 : 24, format === '12' ? localHours % 12 || 12 : localHours, (n) => setLocalHours(n))}
            <Text style={[styles.colon, { color: tokens.color.textPrimary }]}>:</Text>
            {spinnerNumbers(60, localMinutes, setLocalMinutes)}
            {format === '12' && (
              <Pressable
                onPress={() => setMeridiem((m) => (m === 'AM' ? 'PM' : 'AM'))}
                style={[styles.meridiemBtn, { backgroundColor: tokens.color.bgControl, borderRadius: tokens.radius.md }]}
              >
                <Text style={{ color: tokens.color.primary, fontWeight: '700', fontSize: tokens.typography.fontSize.base }}>
                  {meridiem}
                </Text>
              </Pressable>
            )}
          </View>

          <Button label="Confirm" onPress={handleConfirm} fullWidth />
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
    gap: 8,
  },
  label: { fontWeight: '500' },
  value: { fontWeight: '600' },
  modalContent: { gap: 20 },
  formatRow: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  formatBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  pickersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  spinner: { alignItems: 'center', gap: 8 },
  spinnerBtn: { padding: 8 },
  spinnerArrow: { fontSize: 16, fontWeight: '600' },
  spinnerValue: { fontWeight: '700', minWidth: 52, textAlign: 'center' },
  colon: { fontSize: 28, fontWeight: '700' },
  meridiemBtn: { padding: 12, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
});

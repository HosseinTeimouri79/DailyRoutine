import React, { memo } from 'react';
import { Pressable, View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@hadafino/theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Checkbox = memo(function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  style,
  accessibilityLabel,
}: CheckboxProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      style={[styles.container, disabled && styles.disabled, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? tokens.color.primary : tokens.color.borderStrong,
            backgroundColor: checked ? tokens.color.primary : 'transparent',
            borderRadius: tokens.radius.xs,
          },
        ]}
      >
        {checked && (
          <View style={styles.checkmark} />
        )}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: tokens.color.textSecondary,
              fontSize: tokens.typography.fontSize.sm,
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  label: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

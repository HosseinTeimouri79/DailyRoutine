import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@hadafino/theme';

interface IconButtonProps {
  icon: React.ReactNode | string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: { container: 28, icon: 14 },
  md: { container: 36, icon: 16 },
  lg: { container: 44, icon: 20 },
};

export const IconButton = memo(function IconButton({
  icon,
  label,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
}: IconButtonProps): React.JSX.Element {
  const { tokens } = useTheme();
  const sz = SIZES[size];

  const bgMap: Record<string, string> = {
    default: tokens.color.bgControl,
    danger: tokens.color.dangerSoft,
    primary: tokens.color.primarySoft,
    ghost: 'transparent',
  };

  const colorMap: Record<string, string> = {
    default: tokens.color.textSecondary,
    danger: tokens.color.danger,
    primary: tokens.color.primary,
    ghost: tokens.color.textMuted,
  };

  const borderMap: Record<string, string | undefined> = {
    default: tokens.color.borderDefault,
    danger: tokens.color.dangerBorder,
    primary: tokens.color.accentBorder,
    ghost: undefined,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: sz.container,
          height: sz.container,
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
          borderWidth: borderMap[variant] ? 1 : 0,
          borderRadius: tokens.radius.sm,
          opacity: pressed || disabled ? 0.65 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {typeof icon === 'string' ? (
        <Text style={[styles.iconText, { color: colorMap[variant], fontSize: sz.icon }]}>
          {icon}
        </Text>
      ) : (
        icon
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontWeight: '600',
  },
});

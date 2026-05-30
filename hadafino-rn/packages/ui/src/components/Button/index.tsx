import React, { memo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@hadafino/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const SIZES: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: 12, paddingV: 7, fontSize: 13 },
  md: { paddingH: 16, paddingV: 10, fontSize: 15 },
  lg: { paddingH: 20, paddingV: 13, fontSize: 17 },
};

export const Button = memo(function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  onPress,
  ...rest
}: ButtonProps): React.JSX.Element {
  const { tokens } = useTheme();
  const sizeTokens = SIZES[size];
  const isDisabled = disabled || loading;

  const backgroundColorMap: Record<ButtonVariant, string> = {
    primary: tokens.color.primary,
    secondary: tokens.color.bgControl,
    danger: tokens.color.dangerSoft,
    ghost: 'transparent',
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: '#ffffff',
    secondary: tokens.color.textPrimary,
    danger: tokens.color.danger,
    ghost: tokens.color.primary,
  };

  const borderColorMap: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: tokens.color.borderDefault,
    danger: tokens.color.dangerBorder,
    ghost: undefined,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundColorMap[variant],
          paddingHorizontal: sizeTokens.paddingH,
          paddingVertical: sizeTokens.paddingV,
          borderRadius: tokens.radius.md,
          borderWidth: borderColorMap[variant] ? 1 : 0,
          borderColor: borderColorMap[variant],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.85 : isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColorMap[variant]}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              { color: textColorMap[variant], fontSize: sizeTokens.fontSize },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

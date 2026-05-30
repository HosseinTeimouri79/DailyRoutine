import React, { memo, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@hadafino/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Input = memo(
  forwardRef<TextInput, InputProps>(function Input(
    {
      label,
      error,
      hint,
      containerStyle,
      leftAdornment,
      rightAdornment,
      style,
      ...props
    },
    ref,
  ) {
    const { tokens } = useTheme();

    return (
      <View style={[styles.root, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: tokens.color.textSecondary,
                fontSize: tokens.typography.fontSize.sm,
              },
            ]}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputWrapper,
            {
              borderColor: error ? tokens.color.dangerBorder : tokens.color.borderDefault,
              backgroundColor: tokens.color.bgControl,
              borderRadius: tokens.radius.md,
            },
          ]}
        >
          {leftAdornment && <View style={styles.adornment}>{leftAdornment}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: tokens.color.textPrimary,
                fontSize: tokens.typography.fontSize.base,
              },
              style,
            ]}
            placeholderTextColor={tokens.color.textMuted}
            {...props}
          />

          {rightAdornment && <View style={styles.adornment}>{rightAdornment}</View>}
        </View>

        {error && (
          <Text
            style={[
              styles.helperText,
              { color: tokens.color.danger, fontSize: tokens.typography.fontSize.xs },
            ]}
          >
            {error}
          </Text>
        )}
        {!error && hint && (
          <Text
            style={[
              styles.helperText,
              { color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.xs },
            ]}
          >
            {hint}
          </Text>
        )}
      </View>
    );
  }),
);

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    minHeight: 44,
  },
  adornment: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  helperText: {
    marginTop: 2,
  },
});

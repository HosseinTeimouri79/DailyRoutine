import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@hadafino/theme';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  style,
}: DropdownProps<T>): React.JSX.Element {
  const { tokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = useCallback(
    (optionValue: T) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <View style={[styles.root, style]}>
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

      <Pressable
        onPress={() => !disabled && setIsOpen((prev) => !prev)}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: isOpen ? tokens.color.primary : tokens.color.borderDefault,
            backgroundColor: tokens.color.bgControl,
            borderRadius: tokens.radius.md,
            opacity: pressed || disabled ? 0.75 : 1,
          },
        ]}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: isOpen, disabled }}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedOption ? tokens.color.textPrimary : tokens.color.textMuted,
              fontSize: tokens.typography.fontSize.base,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <Text
          style={[
            styles.chevron,
            {
              color: tokens.color.textMuted,
              transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
            },
          ]}
        >
          ▾
        </Text>
      </Pressable>

      {isOpen && (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderDefault,
              borderRadius: tokens.radius.md,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ maxHeight: 200 }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value as T)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: isSelected
                        ? tokens.color.primarySoft
                        : pressed
                          ? tokens.color.bgControl
                          : 'transparent',
                    },
                  ]}
                  accessibilityRole="option"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? tokens.color.primary : tokens.color.textPrimary,
                        fontSize: tokens.typography.fontSize.base,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
    zIndex: 10,
  },
  label: {
    fontWeight: '600',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderWidth: 1,
  },
  triggerText: {
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    marginLeft: 8,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    zIndex: 1000,
    marginTop: 4,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: {},
});

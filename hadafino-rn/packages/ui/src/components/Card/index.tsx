import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@hadafino/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  headerRight?: React.ReactNode;
}

export const Card = memo(function Card({
  children,
  title,
  subtitle,
  style,
  headerRight,
}: CardProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.color.bgSurface,
          borderColor: tokens.color.borderDefault,
          borderRadius: tokens.radius.lg,
        },
        style,
      ]}
    >
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: tokens.color.textPrimary,
                    fontSize: tokens.typography.fontSize.lg,
                  },
                ]}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: tokens.color.textSecondary,
                    fontSize: tokens.typography.fontSize.sm,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
  },
});

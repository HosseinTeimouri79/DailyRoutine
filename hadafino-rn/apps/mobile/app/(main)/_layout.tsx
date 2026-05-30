import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Text } from 'react-native';

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }): React.JSX.Element {
  return (
    <Text style={{ color, fontSize: 11, fontWeight: focused ? '700' : '400', marginTop: 2 }}>
      {label}
    </Text>
  );
}

export default function MainLayout(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.color.bgSurface,
          borderTopColor: tokens.color.borderDefault,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>✓</Text>,
        }}
      />
      <Tabs.Screen
        name="routines/index"
        options={{
          title: t('tabs.routines'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>↻</Text>,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="notes/index"
        options={{
          title: t('tabs.notes'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📝</Text>,
        }}
      />
      <Tabs.Screen
        name="important-days/index"
        options={{
          title: t('tabs.importantDays'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⭐</Text>,
        }}
      />
    </Tabs>
  );
}

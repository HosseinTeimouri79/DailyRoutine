import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Button } from '@hadafino/ui';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { AuthService } from '@hadafino/core';
import { useRouter } from 'expo-router';
import { THEME_OPTIONS, type ThemeName } from '@hadafino/theme';
import type { Language, CalendarType } from '@hadafino/core';
import { changeLanguage } from '@hadafino/i18n';

export default function SettingsScreen(): React.JSX.Element {
  const { tokens, setTheme, themeName } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const { language, calendarType, setLanguage, setCalendarType } = useSettingsStore();
  const { showSnackbar } = useUIStore();

  const handleLogout = useCallback(async () => {
    await AuthService.logout();
    clearSession();
    router.replace('/(auth)/login');
  }, [clearSession, router]);

  const handleLanguageChange = useCallback(
    async (lang: Language) => {
      setLanguage(lang);
      await changeLanguage(lang);
    },
    [setLanguage],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bgPage }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize['2xl'] }]}>
          {t('settings.title')}
        </Text>

        {/* User info */}
        <View style={[styles.section, { backgroundColor: tokens.color.bgSurface, borderColor: tokens.color.borderDefault, borderRadius: tokens.radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('profile.title')}
          </Text>
          <Text style={[styles.userName, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.lg }]}>
            {user?.name ?? t('common.userFallback')}
          </Text>
          <Text style={[{ color: tokens.color.textMuted, fontSize: tokens.typography.fontSize.sm }]}>
            {user?.phone}
          </Text>
        </View>

        {/* Theme */}
        <View style={[styles.section, { backgroundColor: tokens.color.bgSurface, borderColor: tokens.color.borderDefault, borderRadius: tokens.radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('settings.theme')}
          </Text>
          <View style={styles.optionGrid}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setTheme(opt.value as ThemeName)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: themeName === opt.value ? tokens.color.primary : tokens.color.bgControl,
                    borderColor: themeName === opt.value ? tokens.color.primary : tokens.color.borderDefault,
                    borderRadius: tokens.radius.md,
                  },
                ]}
              >
                <Text style={{ color: themeName === opt.value ? '#fff' : tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm, fontWeight: '600' }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Language */}
        <View style={[styles.section, { backgroundColor: tokens.color.bgSurface, borderColor: tokens.color.borderDefault, borderRadius: tokens.radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('settings.language')}
          </Text>
          <View style={styles.optionRow}>
            {(['fa', 'en'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => handleLanguageChange(lang)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: language === lang ? tokens.color.primary : tokens.color.bgControl,
                    borderColor: language === lang ? tokens.color.primary : tokens.color.borderDefault,
                    borderRadius: tokens.radius.md,
                  },
                ]}
              >
                <Text style={{ color: language === lang ? '#fff' : tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm, fontWeight: '600' }}>
                  {lang === 'fa' ? 'فارسی' : 'English'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Calendar type */}
        <View style={[styles.section, { backgroundColor: tokens.color.bgSurface, borderColor: tokens.color.borderDefault, borderRadius: tokens.radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {t('settings.calendarType')}
          </Text>
          <View style={styles.optionRow}>
            {(['jalali', 'gregorian'] as CalendarType[]).map((ct) => (
              <Pressable
                key={ct}
                onPress={() => setCalendarType(ct)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: calendarType === ct ? tokens.color.primary : tokens.color.bgControl,
                    borderColor: calendarType === ct ? tokens.color.primary : tokens.color.borderDefault,
                    borderRadius: tokens.radius.md,
                  },
                ]}
              >
                <Text style={{ color: calendarType === ct ? '#fff' : tokens.color.textSecondary, fontSize: tokens.typography.fontSize.sm, fontWeight: '600' }}>
                  {ct === 'jalali' ? t('auth.calendarJalali') : t('auth.calendarGregorian')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          label={t('auth.logout')}
          variant="danger"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  pageTitle: { fontWeight: '800', marginBottom: 4 },
  section: { padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { fontWeight: '700' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  logoutBtn: { marginTop: 8 },
});

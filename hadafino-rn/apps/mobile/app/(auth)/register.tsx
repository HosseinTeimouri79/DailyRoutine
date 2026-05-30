import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Input, Button, Dropdown, type DropdownOption } from '@hadafino/ui';
import { AuthService } from '@hadafino/core';
import type { CalendarType, Gender } from '@hadafino/core';
import { useAuthStore } from '../../src/store/authStore';

interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  general?: string;
}

export default function RegisterScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarType>('jalali');
  const [gender, setGender] = useState<Gender | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const calendarOptions: DropdownOption<CalendarType>[] = [
    { value: 'jalali', label: t('auth.calendarJalali') },
    { value: 'gregorian', label: t('auth.calendarGregorian') },
  ];

  const genderOptions: DropdownOption<Gender>[] = [
    { value: 'male', label: t('auth.genderMale') },
    { value: 'female', label: t('auth.genderFemale') },
    { value: 'other', label: t('auth.genderOther') },
  ];

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!/^09[0-9]{9}$/.test(phone.trim())) newErrors.phone = t('auth.invalidPhone');
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, password, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await AuthService.register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        calendarType,
        gender: gender || undefined,
      });
      setSession(response.token, response.user);
      router.replace('/(main)');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }, [validate, name, phone, password, calendarType, gender, setSession, router, t]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tokens.color.bgPage }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderDefault,
              borderRadius: tokens.radius.xl,
            },
          ]}
        >
          <Text style={[styles.title, { color: tokens.color.textPrimary, fontSize: tokens.typography.fontSize.xl }]}>
            {t('auth.titleRegister')}
          </Text>

          {errors.general && (
            <View style={[styles.errorBanner, { backgroundColor: tokens.color.dangerSoft, borderRadius: tokens.radius.sm }]}>
              <Text style={{ color: tokens.color.danger, fontSize: tokens.typography.fontSize.sm }}>
                {errors.general}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Input label={t('auth.name')} value={name} onChangeText={setName} error={errors.name} returnKeyType="next" />
            <Input
              label={t('auth.phone')}
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
              returnKeyType="next"
            />
            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              returnKeyType="done"
              rightAdornment={
                <Button
                  label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
            />
            <Dropdown
              label={t('auth.calendarType')}
              options={calendarOptions}
              value={calendarType}
              onChange={setCalendarType}
            />
            <Dropdown
              label={t('auth.gender')}
              options={genderOptions}
              value={gender as Gender}
              onChange={(v) => setGender(v)}
              placeholder="Optional"
            />
            <Button label={t('auth.submitRegister')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />
          </View>

          <Link href="/(auth)/login" asChild>
            <Button label={t('auth.haveAccount')} variant="ghost" size="sm" style={styles.switchLink} />
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24, borderWidth: 1, gap: 20 },
  title: { fontWeight: '700' },
  form: { gap: 16 },
  errorBanner: { padding: 12 },
  switchLink: { alignSelf: 'center' },
});

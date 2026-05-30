import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@hadafino/theme';
import { useTranslation } from '@hadafino/i18n';
import { Input, Button } from '@hadafino/ui';
import { AuthService } from '@hadafino/core';
import { useAuthStore } from '../../src/store/authStore';
import { useUIStore } from '../../src/store/uiStore';

interface FormErrors {
  phone?: string;
  password?: string;
  general?: string;
}

function validatePhone(phone: string): boolean {
  return /^09[0-9]{9}$/.test(phone.trim());
}

export default function LoginScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { showSnackbar } = useUIStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!validatePhone(phone)) {
      newErrors.phone = t('auth.invalidPhone');
    }
    if (!password.trim()) {
      newErrors.password = t('auth.password') + ' is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [phone, password, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await AuthService.login({ phone: phone.trim(), password });
      setSession(response.token, response.user);
      router.replace('/(main)');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }, [validate, phone, password, setSession, router, t]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tokens.color.bgPage }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: tokens.color.textPrimary,
                fontSize: tokens.typography.fontSize['3xl'],
              },
            ]}
          >
            {t('header.title')}
          </Text>
          <Text style={[styles.subtitle, { color: tokens.color.textSecondary, fontSize: tokens.typography.fontSize.base }]}>
            {t('auth.subtitle')}
          </Text>
        </View>

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
          <Text
            style={[
              styles.cardTitle,
              {
                color: tokens.color.textPrimary,
                fontSize: tokens.typography.fontSize.xl,
              },
            ]}
          >
            {t('auth.titleLogin')}
          </Text>

          {errors.general && (
            <View style={[styles.errorBanner, { backgroundColor: tokens.color.dangerSoft, borderRadius: tokens.radius.sm }]}>
              <Text style={{ color: tokens.color.danger, fontSize: tokens.typography.fontSize.sm }}>
                {errors.general}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label={t('auth.phone')}
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
              returnKeyType="next"
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              rightAdornment={
                <Button
                  label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
            />

            <Button
              label={t('auth.submitLogin')}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <Link href="/(auth)/register" asChild>
            <Button label={t('auth.noAccount')} variant="ghost" size="sm" style={styles.switchLink} />
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  header: { alignItems: 'center', gap: 8 },
  title: { fontWeight: '800' },
  subtitle: { textAlign: 'center' },
  card: {
    padding: 24,
    borderWidth: 1,
    gap: 20,
  },
  cardTitle: { fontWeight: '700' },
  form: { gap: 16 },
  errorBanner: { padding: 12 },
  switchLink: { alignSelf: 'center' },
});

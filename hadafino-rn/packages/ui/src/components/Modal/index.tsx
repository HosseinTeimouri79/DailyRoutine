import React, { useEffect, memo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@hadafino/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  scrollable?: boolean;
}

export const Modal = memo(function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  scrollable = true,
}: ModalProps): React.JSX.Element {
  const { tokens } = useTheme();

  const content = scrollable ? (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
      {children}
    </ScrollView>
  ) : (
    <>{children}</>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.overlay, { backgroundColor: tokens.color.overlay }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(220)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: tokens.color.bgSurface,
              borderColor: tokens.color.borderSoft,
              borderRadius: tokens.radius.xl,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              { borderBottomColor: tokens.color.borderSoft },
              title ? styles.headerWithTitle : undefined,
            ]}
          >
            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: tokens.color.textPrimary,
                    fontSize: tokens.typography.fontSize.lg,
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {showCloseButton && (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: tokens.color.bgControl,
                    borderRadius: tokens.radius.full,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={[styles.closeIcon, { color: tokens.color.textSecondary }]}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.body}>{content}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  headerWithTitle: {
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
});

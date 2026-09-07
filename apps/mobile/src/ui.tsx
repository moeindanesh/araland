import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Button, Card } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, Text } from "./typography";

export const colors = {
  ink: "#20382d",
  green: "#245b49",
  muted: "#7c847d",
  cream: "#f6f5f0",
  line: "#e7e9e0",
  white: "#ffffff",
  lime: "#d9edb7",
  pale: "#eaf0e6",
  red: "#b54e43",
};
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 22, paddingBottom: 36, gap: 20 },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  stack: { gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 26,
    lineHeight: 42,
    textAlign: "right",
    writingDirection: "rtl",
  },
  heading: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontSize: 18,
    lineHeight: 30,
    textAlign: "right",
    writingDirection: "rtl",
  },
  text: {
    fontFamily: fonts.regular,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 25,
    textAlign: "right",
    writingDirection: "rtl",
  },
  muted: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 23,
    textAlign: "right",
    writingDirection: "rtl",
  },
  label: {
    fontFamily: fonts.medium,
    color: colors.ink,
    fontSize: 12,
    textAlign: "right",
    marginBottom: 7,
  },
  input: {
    fontFamily: fonts.regular,
    backgroundColor: "#f8f9f5",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "right",
    color: colors.ink,
  },
  badge: {
    fontFamily: fonts.medium,
    color: colors.green,
    backgroundColor: colors.pale,
    fontSize: 11,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: colors.pale,
  },
  error: {
    fontFamily: fonts.regular,
    color: colors.red,
    textAlign: "right",
    lineHeight: 25,
    padding: 12,
    backgroundColor: "#fff0eb",
    borderRadius: 12,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.green,
    textAlign: "right",
    paddingVertical: 7,
  },
});

export function Copy({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <Card style={[styles.card, style]}>{children}</Card>;
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.between}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.muted}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
export function Action({
  children,
  onPress,
  disabled = false,
  busy = false,
  secondary = false,
  danger = false,
  small = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondary?: boolean;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <Button
      onPress={onPress}
      isDisabled={disabled || busy}
      accessibilityState={{ disabled: disabled || busy, busy }}
      variant={danger ? "danger-soft" : secondary ? "outline" : "primary"}
      size={small ? "sm" : "lg"}
      style={{
        borderRadius: 14,
        height: "auto",
        minHeight: small ? 40 : 56,
        paddingVertical: small ? 9 : 13,
        ...(secondary ? { borderColor: colors.line } : {}),
        ...(!secondary && !danger ? { backgroundColor: colors.green } : {}),
      }}
    >
      {busy && (
        <ActivityIndicator
          size="small"
          color={danger ? colors.red : secondary ? colors.green : "#fff"}
        />
      )}
      <Button.Label
        style={{
          fontFamily: fonts.semibold,
          fontWeight: "normal",
          fontSize: small ? 12 : 14,
          lineHeight: small ? 22 : 26,
          textAlign: "center",
          flexShrink: 1,
          color: danger ? colors.red : secondary ? colors.green : "#fff",
        }}
      >
        {children}
      </Button.Label>
    </Button>
  );
}
export function Field({
  label,
  ltr,
  style,
  ...props
}: TextInputProps & { label: string; ltr?: boolean }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#a4aaa1"
        {...props}
        style={[
          styles.input,
          props.editable === false && { opacity: 0.55 },
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          ltr && { textAlign: "left", writingDirection: "ltr" },
          style,
        ]}
      />
    </View>
  );
}
export function Screen({
  children,
  onBack,
  title,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  title?: string;
}) {
  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {onBack && (
        <View
          style={[styles.between, { paddingHorizontal: 22, paddingTop: 12 }]}
        >
          <Text style={styles.heading}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بازگشت"
            onPress={onBack}
          >
            <Text style={styles.link}>بازگشت ←</Text>
          </Pressable>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Panel style={{ alignItems: "center", paddingVertical: 35 }}>
      <Text style={{ fontSize: 28, color: colors.green }}>✦</Text>
      <Text style={[styles.heading, { textAlign: "center" }]}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center" }]}>{description}</Text>
    </Panel>
  );
}
export function Loading({
  error,
  loading,
  retry,
}: {
  error?: string;
  loading: boolean;
  retry?: () => void;
}) {
  if (error)
    return (
      <View style={styles.stack}>
        <Text style={styles.error}>{error}</Text>
        {retry && (
          <Action secondary onPress={retry}>
            تلاش دوباره
          </Action>
        )}
      </View>
    );
  if (loading)
    return <ActivityIndicator color={colors.green} style={{ padding: 30 }} />;
  return null;
}

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text as NativeText,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";
import {
  templates,
  type Site,
  type TemplateId,
  type Stats,
} from "@araland/shared";
import {
  Manager,
  request,
  useAction,
  useManager,
  useResource,
  number,
  WEB_URL,
  publicMedia,
  message,
  confirm,
} from "./src/api";
import {
  Action,
  colors,
  Copy,
  Empty,
  Field,
  Heading,
  Loading,
  Panel,
  Screen,
  styles,
} from "./src/ui";
import { ContentEditor, TemplatesScreen } from "./src/content";
import { fontAssets, Text } from "./src/typography";
import {
  AudienceScreen,
  FormsScreen,
  PostsScreen,
  DomainsScreen,
  FilesScreen,
  SettingsScreen,
} from "./src/management";

Uniwind.setTheme("light");
const TOKEN_KEY = "araland.session";
type Tab = "home" | "content" | "audience" | "more";
type Detail =
  "templates" | "forms" | "posts" | "domains" | "files" | "settings";
const tabs: { id: Tab; icon: string; title: string }[] = [
  { id: "home", icon: "⌂", title: "خانه" },
  { id: "content", icon: "▤", title: "سایت من" },
  { id: "audience", icon: "♧", title: "مخاطبان" },
  { id: "more", icon: "☷", title: "ابزارها" },
];

export default function App() {
  const [fontAttempt, setFontAttempt] = useState(0);
  return (
    <FontLoadedApp
      key={fontAttempt}
      onRetry={() => setFontAttempt((value) => value + 1)}
    />
  );
}

function FontLoadedApp({ onRetry }: { onRetry: () => void }) {
  const [loaded, fontError] = useFonts(fontAssets);
  if (fontError)
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
        ]}
      >
        <NativeText
          accessibilityRole="alert"
          style={{ color: colors.ink, textAlign: "center" }}
        >
          فونت برنامه بارگذاری نشد. دوباره تلاش کنید.
        </NativeText>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={{ padding: 16 }}
        >
          <NativeText style={{ color: colors.green }}>تلاش دوباره</NativeText>
        </Pressable>
      </View>
    );
  if (!loaded)
    return (
      <View style={[styles.root, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider
          config={{
            isRTL: true,
            toast: false,
            devInfo: { stylingPrinciples: false },
          }}
        >
          <StatusBar style="dark" />
          <Session />
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Session() {
  const [token, setToken] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>();
  const [ready, setReady] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [detail, setDetail] = useState<Detail>();
  const [unsavedContent, setUnsavedContent] = useState(false);
  const leaveContent = (action: () => void) => {
    if (unsavedContent)
      confirm(
        "تغییرات ذخیره نشده",
        "با خروج از ویرایشگر، تغییرات ذخیره‌نشده از دست می‌روند.",
        () => {
          setUnsavedContent(false);
          action();
        },
        true,
      );
    else action();
  };

  const restore = async () => {
    setReady(false);
    setRestoreError("");
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        const result = await request<{ sites: Site[] }>("/sites", stored);
        setSites(result.sites);
        setSiteId(result.sites[0]?.id);
        setToken(stored);
      }
    } catch (error) {
      setRestoreError(message(error));
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    void restore();
  }, []);
  const login = async (newToken: string, newSites: Site[]) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setSites(newSites);
    setSiteId(newSites[0]?.id);
    setToken(newToken);
    setRestoreError("");
  };
  const logout = async () => {
    if (token)
      await request("/auth/logout", token, {}, "POST").catch(() => undefined);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setSites([]);
    setSiteId(undefined);
    setTab("home");
    setDetail(undefined);
  };
  const site = sites.find((s) => s.id === siteId);
  const updateSite = (updated: Site) =>
    setSites((all) =>
      all.some((s) => s.id === updated.id)
        ? all.map((s) => (s.id === updated.id ? updated : s))
        : [...all, updated],
    );
  if (!ready)
    return (
      <View style={[styles.root, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  if (!token) return <Login onLogin={login} restoreError={restoreError} />;
  if (!site)
    return (
      <SitePicker
        token={token}
        sites={sites}
        onSelect={(id) => setSiteId(id)}
        onCreated={(created) => {
          updateSite(created);
          setSiteId(created.id);
        }}
        onClose={() => void logout()}
      />
    );

  const openDetail = (next: Detail) => setDetail(next);
  const detailTitles: Record<Detail, string> = {
    templates: "قالب‌های سایت",
    forms: "فرم‌های ارتباط",
    posts: "بلاگ",
    domains: "دامنه اختصاصی",
    files: "فایل‌های مخاطبان",
    settings: "تنظیمات سایت",
  };
  const details: Record<Detail, React.ReactNode> = {
    templates: <TemplatesScreen />,
    forms: <FormsScreen />,
    posts: <PostsScreen />,
    domains: <DomainsScreen />,
    files: <FilesScreen />,
    settings: <SettingsScreen onLogout={logout} />,
  };
  return (
    <Manager.Provider value={{ token, site, updateSite }}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View
          style={[
            styles.between,
            {
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderBottomColor: colors.line,
              borderBottomWidth: 1,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="انتخاب سایت"
            onPress={() => setSelecting(true)}
            style={styles.row}
          >
            <View
              style={{
                width: 42,
                height: 42,
                backgroundColor: colors.green,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.lime, fontSize: 27 }}>{"✳\uFE0E"}</Text>
            </View>
            <View>
              <Text style={[styles.text, { fontSize: 13 }]}>{site.name} ⌄</Text>
              <Text style={styles.muted}>فضای مدیریت شما</Text>
            </View>
          </Pressable>
          <Text style={styles.badge}>
            {site.status === "PUBLISHED" ? "● منتشر شده" : "○ پیش‌نویس"}
          </Text>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            key={`${site.id}-${tab}`}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {tab === "home" && (
              <Home onNavigate={openDetail} onEdit={() => setTab("content")} />
            )}
            {tab === "content" && (
              <ContentEditor onDirtyChange={setUnsavedContent} />
            )}
            {tab === "audience" && <AudienceScreen />}
            {tab === "more" && <Tools onNavigate={openDetail} />}
          </ScrollView>
        </KeyboardAvoidingView>
        <View
          style={{
            flexDirection: "row-reverse",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderColor: colors.line,
            backgroundColor: "#fff",
          }}
        >
          {tabs.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.id }}
              accessibilityLabel={item.title}
              onPress={() => {
                if (tab !== item.id) leaveContent(() => setTab(item.id));
              }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 5,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  color: tab === item.id ? colors.green : "#a0a89e",
                }}
              >
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.muted,
                  {
                    color: tab === item.id ? colors.green : "#a0a89e",
                    fontSize: 11,
                  },
                ]}
              >
                {item.title}
              </Text>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor:
                    tab === item.id ? colors.green : "transparent",
                }}
              />
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
      <Modal
        visible={selecting}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelecting(false)}
      >
        <SitePicker
          token={token}
          sites={sites}
          onSelect={(id) =>
            leaveContent(() => {
              setSiteId(id);
              setSelecting(false);
              setTab("home");
              setDetail(undefined);
            })
          }
          onCreated={(created) => {
            updateSite(created);
            leaveContent(() => {
              setSiteId(created.id);
              setSelecting(false);
              setTab("home");
            });
          }}
          onClose={() => setSelecting(false)}
        />
      </Modal>
      <Modal
        visible={!!detail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetail(undefined)}
      >
        <Screen
          title={detail ? detailTitles[detail] : ""}
          onBack={() => setDetail(undefined)}
        >
          {detail && details[detail]}
        </Screen>
      </Modal>
    </Manager.Provider>
  );
}

function Login({
  onLogin,
  restoreError,
}: {
  onLogin: (token: string, sites: Site[]) => Promise<void>;
  restoreError: string;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    expiresIn: number;
    devCode?: string;
  }>();
  const { busy, run } = useAction();
  const submit = () =>
    run(async () => {
      if (!challenge) {
        const result = await request<{
          challengeId: string;
          expiresIn: number;
          devCode?: string;
        }>("/auth/request", null, { phone }, "POST");
        setChallenge(result);
      } else {
        const normalizedCode = code
          .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 1776))
          .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 1632));
        const result = await request<{ token: string; sites: Site[] }>(
          "/auth/verify",
          null,
          { challengeId: challenge.challengeId, code: normalizedCode },
          "POST",
        );
        await onLogin(result.token, result.sites);
      }
    });
  return (
    <Screen>
      <View
        style={{
          paddingTop: 40,
          paddingBottom: 20,
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 70,
            height: 70,
            backgroundColor: colors.green,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.lime, fontSize: 48 }}>{"✳\uFE0E"}</Text>
        </View>
        <Text style={[styles.title, { fontSize: 40, lineHeight: 64 }]}>
          کسب‌وکارت،{"\n"}همیشه همراهت.
        </Text>
        <Copy muted>
          یک جای کوچک در گوشی شما، برای همه اتفاق‌های بزرگ کسب‌وکارتان.
        </Copy>
      </View>
      <Panel>
        <Heading
          title={challenge ? "کد ورود را بنویسید" : "به آرالند خوش آمدید"}
          subtitle={
            challenge
              ? `کد ارسال‌شده به ${phone} را وارد کنید.`
              : "برای ساخت و مدیریت سایت، با شماره موبایل وارد شوید."
          }
        />
        {!challenge ? (
          <Field
            label="شماره موبایل"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            placeholder="0912 345 6789"
            ltr
          />
        ) : (
          <Field
            label="کد یک‌بارمصرف"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            placeholder="••••••"
            ltr
          />
        )}
        {challenge?.devCode && (
          <Text
            style={[
              styles.error,
              { color: "#8c6c27", backgroundColor: "#fff6dc" },
            ]}
          >
            محیط آزمایشی — کد ورود: {challenge.devCode}
            {"\n"}پیامک واقعی ارسال نشده است.
          </Text>
        )}
        <Action
          onPress={submit}
          busy={busy}
          disabled={challenge ? code.length !== 6 : phone.trim().length < 10}
        >
          {challenge ? "ورود به حساب" : "دریافت کد ورود ←"}
        </Action>
        {challenge && (
          <Action
            secondary
            disabled={busy}
            onPress={() => {
              setChallenge(undefined);
              setCode("");
            }}
          >
            تغییر شماره یا درخواست کد جدید
          </Action>
        )}
        {restoreError && <Copy muted>{restoreError}</Copy>}
      </Panel>
      <View style={[styles.row, { justifyContent: "center", paddingTop: 20 }]}>
        <Copy muted>از ایده تا ارتباط، در یک جا</Copy>
        <Text style={{ color: colors.green }}>✦</Text>
      </View>
    </Screen>
  );
}

function SitePicker({
  token,
  sites,
  onSelect,
  onCreated,
  onClose,
}: {
  token: string;
  sites: Site[];
  onSelect: (id: string) => void;
  onCreated: (site: Site) => void;
  onClose: () => void;
}) {
  const [creating, setCreating] = useState(sites.length === 0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("orbit");
  const { busy, run } = useAction();
  return (
    <Screen title="سایت‌های شما" onBack={onClose}>
      <Heading
        title={creating ? "یک شروع تازه" : "کجا می‌خواهید بروید؟"}
        subtitle={
          creating
            ? "یک نام، یک نشانی و حال‌وهوایی که به شما می‌آید."
            : "سایتی را برای مدیریت انتخاب کنید."
        }
      />
      {!creating &&
        sites.map((site) => (
          <Pressable
            key={site.id}
            onPress={() => onSelect(site.id)}
            accessibilityRole="button"
          >
            <Panel>
              <View style={styles.between}>
                <Text style={styles.heading}>{site.name}</Text>
                <Text style={styles.badge}>
                  {site.status === "PUBLISHED" ? "منتشر شده" : "پیش‌نویس"}
                </Text>
              </View>
              <Copy muted>{site.slug}</Copy>
            </Panel>
          </Pressable>
        ))}
      {!creating && (
        <Action onPress={() => setCreating(true)}>+ ساخت سایت جدید</Action>
      )}
      {creating && (
        <>
          <Panel>
            <Field
              label="نام کسب‌وکار"
              value={name}
              onChangeText={setName}
              placeholder="مثلاً استودیو من"
            />
            <Field
              label="نشانی کوتاه سایت (انگلیسی)"
              value={slug}
              onChangeText={setSlug}
              placeholder="my-studio"
              autoCapitalize="none"
              autoCorrect={false}
              ltr
            />
            <Copy muted>
              حروف انگلیسی کوچک، عدد و خط تیره؛ دامنه اختصاصی را بعداً وصل
              می‌کنید.
            </Copy>
          </Panel>
          <Text style={styles.heading}>قالب شروع را انتخاب کنید</Text>
          {templates.map((template) => (
            <Pressable
              key={template.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: template.id === templateId }}
              onPress={() => setTemplateId(template.id)}
            >
              <Panel
                style={{
                  borderColor:
                    template.id === templateId ? colors.green : colors.line,
                  borderWidth: template.id === templateId ? 2 : 1,
                }}
              >
                <Image
                  source={{ uri: publicMedia(template.image) }}
                  style={[styles.image, { height: 145 }]}
                />
                <View style={styles.between}>
                  <Text style={styles.heading}>{template.name}</Text>
                  <Copy muted>
                    {template.englishName}{" "}
                    {template.id === templateId ? "●" : "○"}
                  </Copy>
                </View>
                <Copy muted>{template.category}</Copy>
              </Panel>
            </Pressable>
          ))}
          <Action
            busy={busy}
            disabled={
              !name.trim() ||
              slug.length < 3 ||
              slug.length > 63 ||
              !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
            }
            onPress={() =>
              run(async () => {
                const result = await request<{ site: Site }>(
                  "/sites",
                  token,
                  { name, slug, templateId },
                  "POST",
                );
                onCreated(result.site);
              })
            }
          >
            ساخت سایت من ←
          </Action>
          {!!sites.length && (
            <Action secondary onPress={() => setCreating(false)}>
              بازگشت به سایت‌ها
            </Action>
          )}
        </>
      )}
    </Screen>
  );
}

function Home({
  onNavigate,
  onEdit,
}: {
  onNavigate: (detail: Detail) => void;
  onEdit: () => void;
}) {
  const { site } = useManager();
  const resource = useResource<Stats>(`/sites/${site.id}/stats`);
  const stats = resource.data;
  const { run } = useAction();
  return (
    <>
      <Heading
        title="سلام، روزت پُر از رشد ✦"
        subtitle="یک نگاه کوتاه به آنچه در سایت شما می‌گذرد."
      />
      <Panel
        style={{
          backgroundColor: colors.green,
          borderColor: colors.green,
          padding: 24,
        }}
      >
        <Text style={[styles.muted, { color: "#c1d3bd" }]}>
          خانه دیجیتال کسب‌وکار شما
        </Text>
        <Text style={[styles.title, { color: "#fff", fontSize: 30 }]}>
          {site.name}
        </Text>
        <Text style={[styles.text, { color: "#dce5d3" }]}>
          {site.status === "PUBLISHED"
            ? "سایت شما منتشر شده و آماده استقبال از مخاطبان است."
            : "ایده‌هایتان را بچینید؛ هر وقت آماده بودید، منتشر کنید."}
        </Text>
        <View style={[styles.between, { marginTop: 10 }]}>
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text
              style={[
                styles.badge,
                { backgroundColor: colors.lime, padding: 12 },
              ]}
            >
              ویرایش سایت ←
            </Text>
          </Pressable>
          {site.status === "PUBLISHED" && (
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                run(async () => {
                  await Linking.openURL(`${WEB_URL}/s/${site.slug}`);
                })
              }
            >
              <Text style={[styles.text, { color: "#fff", fontSize: 12 }]}>
                مشاهده سایت ↗
              </Text>
            </Pressable>
          )}
        </View>
      </Panel>
      <View style={styles.between}>
        <Text style={styles.heading}>نبض سایت شما</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void resource.reload()}
        >
          <Text style={styles.link}>به‌روزرسانی ↻</Text>
        </Pressable>
      </View>
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {stats && (
        <View
          style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 }}
        >
          {[
            { label: "بازدید", value: stats.visits, icon: "◉" },
            { label: "پاسخ فرم", value: stats.leads, icon: "▤" },
            { label: "عضو سایت", value: stats.members, icon: "♧" },
            {
              label: "نرخ تبدیل",
              value: stats.conversion,
              icon: "↗",
              suffix: "٪",
            },
          ].map((stat) => (
            <Panel
              key={stat.label}
              style={{ width: "48%", flexGrow: 1, padding: 18 }}
            >
              <View style={styles.between}>
                <Text style={styles.muted}>{stat.label}</Text>
                <Text style={{ fontSize: 20, color: colors.green }}>
                  {stat.icon}
                </Text>
              </View>
              <Text style={[styles.title, { fontSize: 30 }]}>
                {number(stat.value)}
                {stat.suffix}
              </Text>
            </Panel>
          ))}
        </View>
      )}
      {stats && stats.series.length > 0 && (
        <Panel>
          <Text style={styles.heading}>بازدیدهای اخیر</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              alignItems: "flex-end",
              height: 130,
            }}
          >
            {stats.series.map((point, i) => (
              <View
                key={`${point.label}-${i}`}
                style={{ flex: 1, alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: "75%",
                    height: Math.max(
                      3,
                      (point.value /
                        Math.max(1, ...stats.series.map((p) => p.value))) *
                        90,
                    ),
                    borderRadius: 6,
                    backgroundColor: colors.green,
                  }}
                />
                <Text style={[styles.muted, { fontSize: 9 }]}>
                  {point.label}
                </Text>
              </View>
            ))}
          </View>
          <Copy muted>
            رویدادهای ثبت‌شده سایت؛ بازدید تکراری هم محاسبه می‌شود.
          </Copy>
        </Panel>
      )}
      <Heading title="قدم بعدی شما" subtitle="کارهای کوچک، تاثیرهای بزرگ." />
      <Pressable accessibilityRole="button" onPress={() => onNavigate("forms")}>
        <Panel>
          <Text style={styles.heading}>گفتگو را شروع کنید ↖</Text>
          <Copy muted>
            فرم ارتباط بسازید و اولین درخواست‌های مشتریان را دریافت کنید.
          </Copy>
        </Panel>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onNavigate("domains")}
      >
        <Panel style={{ backgroundColor: "#edf0e3" }}>
          <Text style={styles.heading}>نشانی خودتان را داشته باشید ↖</Text>
          <Copy muted>دامنه اختصاصی، یک قدم به هویت حرفه‌ای نزدیک‌تر.</Copy>
        </Panel>
      </Pressable>
    </>
  );
}

function Tools({ onNavigate }: { onNavigate: (detail: Detail) => void }) {
  const tools: { id: Detail; title: string; subtitle: string; icon: string }[] =
    [
      {
        id: "templates",
        title: "قالب‌های سایت",
        subtitle: "پنج شخصیت متفاوت برای کسب‌وکار شما",
        icon: "▦",
      },
      {
        id: "forms",
        title: "فرم‌های ارتباط",
        subtitle: "ساخت فرم و دریافت پاسخ مشتریان",
        icon: "▤",
      },
      {
        id: "files",
        title: "فایل‌های مخاطبان",
        subtitle: "تحویل امن فایل به اعضای سایت",
        icon: "↥",
      },
      {
        id: "posts",
        title: "بلاگ",
        subtitle: "انتشار نوشته‌ها و روایت برند شما",
        icon: "✎",
      },
      {
        id: "domains",
        title: "دامنه اختصاصی",
        subtitle: "اتصال و بررسی مالکیت دامنه",
        icon: "◎",
      },
      {
        id: "settings",
        title: "تنظیمات",
        subtitle: "نام سایت، موتورهای جستجو و حساب",
        icon: "⚙",
      },
    ];
  return (
    <>
      <Heading
        title="هر چیزی که نیاز دارید"
        subtitle="ابزارهایی برای رشد خانه دیجیتال شما."
      />
      {tools.map((tool) => (
        <Pressable
          accessibilityRole="button"
          key={tool.id}
          onPress={() => onNavigate(tool.id)}
        >
          <Panel>
            <View style={styles.row}>
              <View
                style={{
                  backgroundColor: colors.pale,
                  borderRadius: 15,
                  padding: 10,
                  width: 48,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 23, color: colors.green }}>
                  {tool.icon}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heading}>{tool.title}</Text>
                <Copy muted>{tool.subtitle}</Copy>
              </View>
              <Text style={{ color: colors.green }}>←</Text>
            </View>
          </Panel>
        </Pressable>
      ))}
    </>
  );
}

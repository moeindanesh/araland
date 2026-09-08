import React, { useState } from "react";
import { Alert, Linking, Pressable, Switch, View } from "react-native";
import { Text } from "./typography";
import { normalizeSearchText } from "./search";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type {
  Domain,
  FormField,
  Lead,
  Member,
  Post,
  Site,
  SiteFile,
  SiteForm,
} from "@araland/shared";
import {
  API_URL,
  confirm,
  date,
  number,
  request,
  useAction,
  useManager,
  useResource,
} from "./api";
import {
  Action,
  colors,
  Copy,
  Empty,
  Field,
  Heading,
  Loading,
  Panel,
  styles,
} from "./ui";

export function AudienceScreen() {
  const { site } = useManager();
  const [tab, setTab] = useState<"leads" | "members">("leads");
  const [query, setQuery] = useState("");
  const leads = useResource<{ leads: Lead[] }>(`/sites/${site.id}/leads`);
  const members = useResource<{ members: Member[] }>(
    `/sites/${site.id}/members`,
  );
  const commonLabels: Record<string, string> = {
    name: "نام و نام خانوادگی",
    phone: "شماره موبایل",
    email: "ایمیل",
    message: "پیام",
  };
  const resource = tab === "leads" ? leads : members;
  const search = normalizeSearchText(query);
  const visibleLeads = leads.data?.leads.filter((lead) =>
    normalizeSearchText(Object.values(lead.values).join(" ")).includes(search),
  );
  const visibleMembers = members.data?.members.filter((member) =>
    normalizeSearchText(`${member.phone} ${member.name || ""}`).includes(search),
  );
  const { run } = useAction();
  return (
    <>
      <Heading
        title="پشت هر عدد، یک آدم"
        subtitle="درخواست‌ها و اعضای سایتتان را اینجا پیدا کنید."
      />
      <View
        style={[
          styles.row,
          { backgroundColor: "#e8ece3", borderRadius: 15, padding: 5, gap: 5 },
        ]}
      >
        {(["leads", "members"] as const).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            key={item}
            onPress={() => setTab(item)}
            style={{
              flex: 1,
              alignItems: "center",
              padding: 10,
              borderRadius: 11,
              backgroundColor: tab === item ? "#fff" : "transparent",
            }}
          >
            <Text style={styles.text}>
              {item === "leads" ? "پاسخ فرم‌ها" : "اعضای سایت"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="جستجوی مخاطب"
        value={query}
        onChangeText={setQuery}
        placeholder="نام، شماره یا متن درخواست..."
      />
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {tab === "leads" &&
        visibleLeads?.map((lead) => (
          <Panel key={lead.id}>
            <View style={styles.between}>
              <Text style={styles.heading}>{lead.formTitle}</Text>
              <Copy muted>{date(lead.createdAt)}</Copy>
            </View>
            {Object.entries(lead.values).map(([key, value]) => (
              <View key={key} style={styles.stack}>
                <Text style={[styles.muted, { fontSize: 10 }]}>
                  {lead.fieldLabels?.[key] || commonLabels[key] || "پاسخ"}
                </Text>
                <Text selectable style={styles.text}>
                  {value}
                </Text>
              </View>
            ))}
          </Panel>
        ))}
      {tab === "members" &&
        visibleMembers?.map((member) => (
          <Panel key={member.id}>
            <View style={styles.between}>
              <Text style={styles.heading}>{member.name || "عضو سایت"}</Text>
              <Copy muted>{date(member.createdAt)}</Copy>
            </View>
            <Text selectable style={[styles.text, { writingDirection: "ltr" }]}>
              {member.phone}
            </Text>
            <Action
              secondary
              small
              onPress={() =>
                run(async () => {
                  await Linking.openURL(`tel:${member.phone}`);
                })
              }
            >
              تماس با مخاطب ↗
            </Action>
          </Panel>
        ))}
      {!resource.loading &&
        !resource.error &&
        (tab === "leads"
          ? visibleLeads?.length === 0
          : visibleMembers?.length === 0) && (
          <Empty
            title={search ? "موردی پیدا نشد" : "شروع یک ارتباط تازه"}
            description={
              search
                ? "با نام یا شماره دیگری جستجو کنید."
                : tab === "leads"
                  ? "پس از ثبت فرم در سایت، پاسخ‌ها اینجا ظاهر می‌شوند."
                  : "افرادی که با شماره موبایل در سایت عضو شوند، اینجا نمایش داده می‌شوند."
            }
          />
        )}
      <Action secondary onPress={() => void resource.reload()}>
        به‌روزرسانی فهرست ↻
      </Action>
    </>
  );
}

const defaultFields = (): FormField[] => [
  { id: "name", label: "نام و نام خانوادگی", type: "text", required: true },
  { id: "phone", label: "شماره موبایل", type: "phone", required: true },
];
const fieldTypes: { id: FormField["type"]; name: string }[] = [
  { id: "text", name: "متن" },
  { id: "phone", name: "موبایل" },
  { id: "email", name: "ایمیل" },
  { id: "textarea", name: "متن بلند" },
  { id: "select", name: "انتخابی" },
];

export function FormsScreen() {
  const { token, site } = useManager();
  const resource = useResource<{ forms: SiteForm[] }>(
    `/sites/${site.id}/forms`,
  );
  const { busy, run } = useAction();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [title, setTitle] = useState("درخواست مشاوره");
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const fieldChange = (id: string, changes: Partial<FormField>) =>
    setFields((all) =>
      all.map((field) => (field.id === id ? { ...field, ...changes } : field)),
    );
  return (
    <>
      <Heading
        title="راه گفتگو را باز کنید"
        subtitle="فرم‌های این بخش در قسمت ارتباط سایت عمومی نمایش داده می‌شوند."
      />
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!creating && (
        <Action
          onPress={() => {
            setEditingId(undefined);
            setTitle("درخواست مشاوره");
            setFields(defaultFields());
            setCreating(true);
          }}
        >
          + ساخت فرم جدید
        </Action>
      )}
      {creating && (
        <>
          <Panel>
            <Text style={styles.heading}>
              {editingId ? "ویرایش فرم" : "فرم تازه"}
            </Text>
            <Field label="نام فرم" value={title} onChangeText={setTitle} />
            <Copy muted>
              فیلدهای لازم را اضافه کنید. هر فیلد یک نام و نوع مستقل دارد.
            </Copy>
          </Panel>
          {fields.map((field, index) => (
            <Panel key={field.id}>
              <View style={styles.between}>
                <Text style={styles.heading}>فیلد {number(index + 1)}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setFields((all) =>
                      all.filter((item) => item.id !== field.id),
                    )
                  }
                >
                  <Text style={[styles.link, { color: colors.red }]}>حذف</Text>
                </Pressable>
              </View>
              <Field
                label="عنوان فیلد"
                value={field.label}
                onChangeText={(label) => fieldChange(field.id, { label })}
              />
              <View
                style={{
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {fieldTypes.map((type) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: field.type === type.id }}
                    key={type.id}
                    onPress={() => fieldChange(field.id, { type: type.id })}
                  >
                    <Text
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            field.type === type.id ? colors.green : colors.pale,
                          color: field.type === type.id ? "#fff" : colors.green,
                        },
                      ]}
                    >
                      {type.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {field.type === "select" && (
                <Field
                  label="گزینه‌ها (هر گزینه در یک خط)"
                  multiline
                  value={field.options?.join("\n") || ""}
                  onChangeText={(value) =>
                    fieldChange(field.id, { options: value.split("\n") })
                  }
                />
              )}
              <View style={styles.between}>
                <Copy>پاسخ الزامی است</Copy>
                <Switch
                  accessibilityLabel="پاسخ الزامی"
                  value={field.required}
                  onValueChange={(required) =>
                    fieldChange(field.id, { required })
                  }
                  trackColor={{ true: colors.green }}
                />
              </View>
            </Panel>
          ))}
          <Action
            secondary
            onPress={() =>
              setFields((all) => [
                ...all,
                {
                  id: `field-${Date.now()}`,
                  label: "",
                  type: "text",
                  required: false,
                },
              ])
            }
          >
            + افزودن فیلد
          </Action>
          <Action
            busy={busy}
            disabled={
              !title.trim() ||
              fields.length === 0 ||
              fields.some(
                (field) =>
                  !field.label.trim() ||
                  (field.type === "select" &&
                    !field.options?.some((option) => option.trim())),
              )
            }
            onPress={() =>
              run(async () => {
                await request(
                  `/sites/${site.id}/forms${editingId ? `/${editingId}` : ""}`,
                  token,
                  {
                    title,
                    fields: fields.map((field) => ({
                      ...field,
                      options: field.options
                        ?.map((option) => option.trim())
                        .filter(Boolean),
                    })),
                  },
                  editingId ? "PATCH" : "POST",
                );
                await resource.reload();
                setCreating(false);
                setEditingId(undefined);
                setFields(defaultFields());
              }, "فرم ذخیره شد.")
            }
          >
            ذخیره فرم
          </Action>
          <Action secondary onPress={() => setCreating(false)}>
            انصراف
          </Action>
        </>
      )}
      {!resource.loading &&
        !resource.error &&
        resource.data?.forms.length === 0 &&
        !creating && (
          <Empty
            title="هنوز فرمی ندارید"
            description="فرم بسازید تا مخاطبان بتوانند درخواست خود را ثبت کنند."
          />
        )}
      {!creating &&
        resource.data?.forms.map((form) => (
          <Panel key={form.id}>
            <Text style={styles.heading}>{form.title}</Text>
            {form.fields.map((field) => (
              <Text key={field.id} style={styles.muted}>
                {field.required ? "✦ " : ""}
                {field.label} ·{" "}
                {fieldTypes.find((type) => type.id === field.type)?.name}
              </Text>
            ))}
            <Action
              secondary
              small
              disabled={busy}
              onPress={() => {
                setEditingId(form.id);
                setTitle(form.title);
                setFields(
                  JSON.parse(JSON.stringify(form.fields)) as FormField[],
                );
                setCreating(true);
              }}
            >
              ویرایش فرم ✎
            </Action>
            <Action
              danger
              small
              disabled={busy}
              onPress={() =>
                confirm(
                  "حذف فرم",
                  "فرم از سایت حذف می‌شود؛ پاسخ‌های قبلی در فهرست مخاطبان باقی می‌مانند.",
                  () =>
                    run(async () => {
                      await request(
                        `/sites/${site.id}/forms/${form.id}`,
                        token,
                        undefined,
                        "DELETE",
                      );
                      await resource.reload();
                    }),
                  true,
                )
              }
            >
              حذف فرم
            </Action>
          </Panel>
        ))}
    </>
  );
}

export function PostsScreen() {
  const { token, site } = useManager();
  const resource = useResource<{ posts: Post[] }>(`/sites/${site.id}/posts`);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [post, setPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    cover: "",
    published: false,
  });
  const { busy, run } = useAction();
  return (
    <>
      <Heading
        title="داستان شما خواندنی است"
        subtitle="نوشته‌های منتشرشده در بخش بلاگ سایت نمایش داده می‌شوند."
      />
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!creating && (
        <Action
          onPress={() => {
            setEditingId(undefined);
            setPost({
              title: "",
              slug: "",
              excerpt: "",
              body: "",
              cover: "",
              published: false,
            });
            setCreating(true);
          }}
        >
          + نوشته جدید
        </Action>
      )}
      {creating && (
        <Panel>
          <Text style={styles.heading}>
            {editingId ? "ویرایش نوشته" : "نوشته تازه"}
          </Text>
          <Field
            label="عنوان نوشته"
            value={post.title}
            onChangeText={(title) => setPost({ ...post, title })}
          />
          <Field
            label="نشانی نوشته"
            value={post.slug}
            onChangeText={(slug) => setPost({ ...post, slug })}
            ltr
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="my-first-post"
          />
          <Field
            label="خلاصه"
            value={post.excerpt}
            onChangeText={(excerpt) => setPost({ ...post, excerpt })}
            multiline
          />
          <Field
            label="متن نوشته"
            value={post.body}
            onChangeText={(body) => setPost({ ...post, body })}
            multiline
            style={{ minHeight: 220 }}
          />
          <Field
            label="نشانی تصویر جلد (اختیاری)"
            value={post.cover}
            onChangeText={(cover) => setPost({ ...post, cover })}
            ltr
            autoCapitalize="none"
          />
          <View style={styles.between}>
            <Copy>انتشار بلافاصله پس از ذخیره</Copy>
            <Switch
              accessibilityLabel="انتشار نوشته"
              value={post.published}
              onValueChange={(published) => setPost({ ...post, published })}
              trackColor={{ true: colors.green }}
            />
          </View>
          <Action
            busy={busy}
            disabled={
              !post.title.trim() ||
              !/^[a-zA-Z0-9\u0600-\u06FF]+(?:-[a-zA-Z0-9\u0600-\u06FF]+)*$/.test(
                post.slug,
              ) ||
              !post.body.trim()
            }
            onPress={() =>
              run(async () => {
                await request(
                  `/sites/${site.id}/posts${editingId ? `/${editingId}` : ""}`,
                  token,
                  {
                    ...post,
                    cover: post.cover || (editingId ? null : undefined),
                  },
                  editingId ? "PATCH" : "POST",
                );
                await resource.reload();
                setCreating(false);
                setEditingId(undefined);
                setPost({
                  title: "",
                  slug: "",
                  excerpt: "",
                  body: "",
                  cover: "",
                  published: false,
                });
              }, "نوشته ذخیره شد.")
            }
          >
            ذخیره نوشته
          </Action>
          <Action secondary onPress={() => setCreating(false)}>
            انصراف
          </Action>
        </Panel>
      )}
      {!creating &&
        resource.data?.posts.map((post) => (
          <Panel key={post.id}>
            <View style={styles.between}>
              <Text style={[styles.heading, { flex: 1 }]}>{post.title}</Text>
              <Text style={styles.badge}>
                {post.published ? "منتشر شده" : "پیش‌نویس"}
              </Text>
            </View>
            <Copy muted>{post.excerpt}</Copy>
            <Copy muted>{date(post.createdAt)}</Copy>
            <Action
              secondary
              small
              disabled={busy}
              onPress={() => {
                setEditingId(post.id);
                setPost({
                  title: post.title,
                  slug: post.slug,
                  excerpt: post.excerpt,
                  body: post.body,
                  cover: post.cover || "",
                  published: post.published,
                });
                setCreating(true);
              }}
            >
              ویرایش و انتشار ✎
            </Action>
            <Action
              danger
              small
              disabled={busy}
              onPress={() =>
                confirm(
                  "حذف نوشته",
                  "این نوشته برای همیشه حذف می‌شود.",
                  () =>
                    run(async () => {
                      await request(
                        `/sites/${site.id}/posts/${post.id}`,
                        token,
                        undefined,
                        "DELETE",
                      );
                      await resource.reload();
                    }),
                  true,
                )
              }
            >
              حذف نوشته
            </Action>
          </Panel>
        ))}
      {!resource.loading &&
        !resource.error &&
        resource.data?.posts.length === 0 &&
        !creating && (
          <Empty
            title="از اولین نوشته شروع کنید"
            description="تجربه، دانش و اخبار کسب‌وکارتان را با مخاطبان به اشتراک بگذارید."
          />
        )}
    </>
  );
}

export function DomainsScreen() {
  const { token, site } = useManager();
  const resource = useResource<{ domains: Domain[] }>(
    `/sites/${site.id}/domains`,
  );
  const [hostname, setHostname] = useState("");
  const { busy, run } = useAction();
  return (
    <>
      <Heading
        title="یک نشانی فقط برای شما"
        subtitle="دامنه‌ای که مالک آن هستید به سایتتان متصل کنید."
      />
      <Panel>
        <Field
          label="نام دامنه"
          value={hostname}
          onChangeText={setHostname}
          ltr
          autoCapitalize="none"
          keyboardType="url"
          placeholder="example.ir"
        />
        <Copy muted>دامنه را بدون https و مسیر وارد کنید.</Copy>
        <Action
          busy={busy}
          disabled={!hostname.trim()}
          onPress={() =>
            run(async () => {
              await request(
                `/sites/${site.id}/domains`,
                token,
                { hostname: hostname.trim().toLowerCase() },
                "POST",
              );
              setHostname("");
              await resource.reload();
            })
          }
        >
          افزودن دامنه +
        </Action>
      </Panel>
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data?.domains.map((domain) => (
        <Panel key={domain.id}>
          <View style={styles.between}>
            <Text
              selectable
              style={[styles.heading, { writingDirection: "ltr", flex: 1 }]}
            >
              {domain.hostname}
            </Text>
            <Text style={styles.badge}>
              {domain.status === "VERIFIED"
                ? "مالکیت تایید شده"
                : "در انتظار تایید"}
            </Text>
          </View>
          {domain.status !== "VERIFIED" && (
            <>
              <Copy>یک رکورد TXT در پنل DNS دامنه اضافه کنید:</Copy>
              <Copy muted>نام رکورد</Copy>
              <Text
                selectable
                style={[styles.input, { textAlign: "left" }]}
              >{`_araland.${domain.hostname}`}</Text>
              <Copy muted>مقدار رکورد</Copy>
              <Text
                selectable
                style={[styles.input, { textAlign: "left", fontSize: 11 }]}
              >{`araland-verification=${domain.verificationToken}`}</Text>
              <Copy muted>
                اعمال تغییرات DNS ممکن است کمی زمان ببرد. بعد از ذخیره رکورد،
                بررسی را بزنید.
              </Copy>
              <Action
                secondary
                busy={busy}
                onPress={() =>
                  run(async () => {
                    await request(
                      `/sites/${site.id}/domains/${domain.id}/verify`,
                      token,
                      {},
                      "POST",
                    );
                    await resource.reload();
                  }, "بررسی دامنه انجام شد.")
                }
              >
                بررسی مالکیت ↻
              </Action>
            </>
          )}
          <Copy muted>
            نمایش سایت روی دامنه به تنظیم مسیر DNS به سرور استقرار و فعال‌سازی
            HTTPS نیز نیاز دارد.
          </Copy>
          <Action danger small disabled={busy} onPress={() => confirm("حذف دامنه", "اتصال این دامنه به سایت حذف می‌شود. آدرس پیش‌فرض سایت باقی می‌ماند؛ رکوردهای DNS جداگانه مدیریت می‌شوند.", () => run(async () => {
            await request(`/sites/${site.id}/domains/${domain.id}`, token, undefined, "DELETE");
            await resource.reload();
          }, "دامنه از سایت حذف شد."), true)}>
            حذف دامنه
          </Action>
        </Panel>
      ))}
    </>
  );
}

export function FilesScreen() {
  const { token, site } = useManager();
  const resource = useResource<{ files: SiteFile[] }>(
    `/sites/${site.id}/files`,
  );
  const [title, setTitle] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selected, setSelected] =
    useState<DocumentPicker.DocumentPickerAsset>();
  const { busy, run } = useAction();
  return (
    <>
      <Heading
        title="تحویل امن، مستقیم به مخاطب"
        subtitle="فایل در پنل شخصی عضو سایت نمایش داده می‌شود."
      />
      <Panel>
        <Field
          label="عنوان فایل"
          value={title}
          onChangeText={setTitle}
          placeholder="مثلاً برنامه مشاوره"
        />
        <Field
          label="شماره موبایل گیرنده"
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          keyboardType="phone-pad"
          ltr
          placeholder="09123456789"
        />
        <Copy muted>
          گیرنده برای دیدن فایل باید با همین شماره عضو این سایت شود. حداکثر حجم
          فایل: ۲۰ مگابایت.
        </Copy>
        <Action
          secondary
          busy={busy}
          onPress={() =>
            run(async () => {
              const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
              });
              if (!result.canceled) setSelected(result.assets[0]);
            })
          }
        >
          {selected ? selected.name : "انتخاب فایل ↑"}
        </Action>
        {selected && (
          <Copy muted>
            {number(Math.ceil((selected.size || 0) / 1024))} کیلوبایت
          </Copy>
        )}
        <Action
          busy={busy}
          disabled={
            !selected || !title.trim() || recipientPhone.trim().length < 10
          }
          onPress={() =>
            run(async () => {
              if (!selected) return;
              const body = new FormData();
              body.append("title", title);
              body.append("recipientPhone", recipientPhone);
              (
                body as unknown as {
                  append: (name: string, value: unknown) => void;
                }
              ).append("file", {
                uri: selected.uri,
                name: selected.name,
                type: selected.mimeType || "application/octet-stream",
              });
              await request(`/sites/${site.id}/files`, token, body, "POST");
              setTitle("");
              setRecipientPhone("");
              setSelected(undefined);
              await resource.reload();
            }, "فایل در پنل مخاطب قرار گرفت.")
          }
        >
          ارسال فایل به پنل مخاطب ←
        </Action>
      </Panel>
      <Loading
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data?.files.map((file) => (
        <Panel key={file.id}>
          <View style={styles.between}>
            <Text style={[styles.heading, { flex: 1 }]}>{file.title}</Text>
            <Copy muted>{date(file.createdAt)}</Copy>
          </View>
          <Copy muted>
            {file.originalName} · {number(Math.ceil(file.size / 1024))} کیلوبایت
          </Copy>
          <Text selectable style={styles.text}>
            {file.recipientPhone}
          </Text>
          <Action
            small
            secondary
            disabled={busy}
            onPress={() =>
              run(async () => {
                if (!FileSystem.cacheDirectory)
                  throw new Error("فضای موقت فایل در دسترس نیست.");
                const extension =
                  file.originalName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] || "";
                const result = await FileSystem.downloadAsync(
                  `${API_URL}/files/${file.id}/download`,
                  `${FileSystem.cacheDirectory}araland-${file.id}${extension}`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                if (result.status !== 200) {
                  await FileSystem.deleteAsync(result.uri, {
                    idempotent: true,
                  });
                  throw new Error("امکان دریافت فایل وجود ندارد.");
                }
                try {
                  if (await Sharing.isAvailableAsync())
                    await Sharing.shareAsync(result.uri, {
                      mimeType: file.mimeType,
                      dialogTitle: file.title,
                    });
                  else
                    Alert.alert(
                      "فایل دریافت شد",
                      "اشتراک‌گذاری فایل در این دستگاه در دسترس نیست.",
                    );
                } finally {
                  await FileSystem.deleteAsync(result.uri, {
                    idempotent: true,
                  });
                }
              })
            }
          >
            دریافت فایل ↓
          </Action>
          <Action danger small disabled={busy} onPress={() => confirm("حذف و لغو دسترسی فایل", "این فایل از پنل گیرنده حذف می‌شود. نسخه‌ای که قبلاً دانلود شده قابل پس‌گرفتن نیست.", () => run(async () => {
            await request(`/sites/${site.id}/files/${file.id}`, token, undefined, "DELETE");
            await resource.reload();
          }, "فایل حذف و دسترسی به آن لغو شد."), true)}>
            حذف و لغو دسترسی
          </Action>
        </Panel>
      ))}
      {!resource.loading &&
        !resource.error &&
        resource.data?.files.length === 0 && (
          <Empty
            title="هنوز فایلی ارسال نشده"
            description="قرارداد، جزوه یا پیشنهاد اختصاصی را به مخاطب مورد نظر تحویل دهید."
          />
        )}
    </>
  );
}

export function SettingsScreen({
  onLogout,
}: {
  onLogout: () => Promise<void>;
}) {
  const { token, site, updateSite } = useManager();
  const [name, setName] = useState(site.name);
  const [seo, setSeo] = useState(site.seo);
  const { busy, run } = useAction();
  return (
    <>
      <Heading
        title="جزئیات مهم خانه شما"
        subtitle="اطلاعات اصلی سایت و نمایش در موتورهای جستجو."
      />
      <Panel>
        <Field label="نام سایت در مدیریت" value={name} onChangeText={setName} />
        <Field
          label="عنوان موتورهای جستجو"
          value={seo.title}
          onChangeText={(title) => setSeo({ ...seo, title })}
          maxLength={80}
        />
        <Field
          label="توضیح موتورهای جستجو"
          value={seo.description}
          onChangeText={(description) => setSeo({ ...seo, description })}
          multiline
          maxLength={200}
        />
        <Copy muted>یک توضیح واضح و کوتاه درباره کسب‌وکارتان بنویسید.</Copy>
        <Action
          busy={busy}
          disabled={!name.trim()}
          onPress={() =>
            run(async () => {
              const result = await request<{ site: Site }>(
                `/sites/${site.id}`,
                token,
                { name, seo },
                "PATCH",
              );
              updateSite(result.site);
            }, "تنظیمات سایت ذخیره شد.")
          }
        >
          ذخیره تنظیمات
        </Action>
      </Panel>
      <Panel>
        <Text style={styles.heading}>حساب کاربری</Text>
        <Copy muted>نشست ورود شما در فضای امن دستگاه نگهداری می‌شود.</Copy>
        <Action
          danger
          busy={busy}
          onPress={() =>
            confirm(
              "خروج از حساب",
              "برای ورود دوباره به کد پیامکی نیاز دارید.",
              () => run(onLogout),
            )
          }
        >
          خروج از حساب
        </Action>
      </Panel>
      <Copy muted>آرالند · نسخه ۰.۱.۰</Copy>
    </>
  );
}

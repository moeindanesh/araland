import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, Switch, View } from "react-native";
import { Text } from "./typography";
import * as DocumentPicker from "expo-document-picker";
import {
  sectionLabels,
  templates,
  createSitePage,
  normalizeContent,
  normalizePageSlug,
  isValidPageSlug,
  pageKindLabels,
  removeSitePage,
  type NavigationItem,
  type Section,
  type SectionItem,
  type SectionType,
  type Site,
  type SiteContent,
  type SitePage,
} from "@araland/shared";
import { confirm, publicMedia, request, useAction, useManager } from "./api";
import {
  Action,
  colors,
  Copy,
  Field,
  Heading,
  Panel,
  Screen,
  styles,
} from "./ui";

const uniqueId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function PageChoice({
  pages,
  value,
  onChange,
  disabled = false,
}: {
  pages: SitePage[];
  value?: string;
  onChange: (id?: string) => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.stack}>
      <Action
        small
        secondary
        disabled={disabled}
        onPress={() => setExpanded(!expanded)}
      >
        {value
          ? `صفحه مقصد: ${pages.find((page) => page.id === value)?.title || "صفحه حذف‌شده"}`
          : "انتخاب صفحه داخلی"}
      </Action>
      {expanded && (
        <>
          {pages.length === 0 && (
            <Copy muted>ابتدا یک صفحه به سایت اضافه کنید.</Copy>
          )}
          {pages.map((page) => (
            <Action
              key={page.id}
              small
              secondary={value !== page.id}
              disabled={disabled}
              onPress={() => {
                onChange(page.id);
                setExpanded(false);
              }}
            >
              {page.title}
              {page.enabled ? "" : " · غیرفعال"}
            </Action>
          ))}
          {value && (
            <Action
              small
              secondary
              disabled={disabled}
              onPress={() => {
                onChange(undefined);
                setExpanded(false);
              }}
            >
              حذف پیوند داخلی
            </Action>
          )}
        </>
      )}
      {value && (
        <Copy muted>
          با تغییر آدرس صفحه، این پیوند خودکار به‌روز می‌شود. صفحه غیرفعال در
          سایت عمومی لینک نمی‌شود.
        </Copy>
      )}
    </View>
  );
}

function NavigationEditor({
  content,
  onApply,
  onClose,
}: {
  content: SiteContent;
  onApply: (navigation: NonNullable<SiteContent["navigation"]>) => void;
  onClose: () => void;
}) {
  const initialHeader: NavigationItem[] = [
    ["services", "خدمات ما"],
    ["about", "درباره ما"],
    ["blog", "خواندنی‌ها"],
    ["contact", "در ارتباط باشیم"],
  ].flatMap(([type, label]) => {
    const section = content.sections.find(
      (item) => item.enabled && item.type === type,
    );
    return section
      ? [
          {
            id: uniqueId("nav"),
            label,
            target: { type: "section" as const, sectionId: section.id },
          },
        ]
      : [];
  });
  const contact = content.sections.find(
    (section) => section.enabled && section.type === "contact",
  );
  const [navigation, setNavigation] = useState<
    NonNullable<SiteContent["navigation"]>
  >(
    content.navigation ?? {
      header: initialHeader,
      footer: contact
        ? [
            {
              id: uniqueId("nav"),
              label: "تماس با ما",
              target: { type: "section", sectionId: contact.id },
            },
          ]
        : [],
    },
  );
  const update = (
    placement: "header" | "footer",
    id: string,
    partial: Partial<NavigationItem>,
  ) =>
    setNavigation((current) => ({
      ...current,
      [placement]: current[placement].map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));
  const move = (
    placement: "header" | "footer",
    index: number,
    direction: number,
  ) => {
    const items = [...navigation[placement]];
    [items[index], items[index + direction]] = [
      items[index + direction],
      items[index],
    ];
    setNavigation({ ...navigation, [placement]: items });
  };
  const valid = [...navigation.header, ...navigation.footer].every(
    (item) =>
      item.label.trim() &&
      (item.target.type !== "url" || item.target.url.trim()),
  );
  return (
    <Screen title="منوهای سایت" onBack={onClose}>
      <Heading
        title="مسیر رسیدن به صفحه‌ها"
        subtitle="منوی بالا و پایین در همه صفحه‌ها مشترک است. صفحه‌های فعال می‌توانند بدون حضور در منو هم لینک مستقیم داشته باشند."
      />
      {(["header", "footer"] as const).map((placement) => (
        <View key={placement} style={styles.stack}>
          <Text style={styles.heading}>
            {placement === "header" ? "منوی بالای سایت" : "منوی پایین سایت"}
          </Text>
          {navigation[placement].map((item, index) => (
            <Panel key={item.id}>
              <Field
                label="متن پیوند"
                value={item.label}
                maxLength={160}
                onChangeText={(label) => update(placement, item.id, { label })}
              />
              <Copy muted>
                مقصد:{" "}
                {item.target.type === "home"
                  ? "صفحه اصلی"
                  : item.target.type === "page"
                    ? "صفحه داخلی"
                    : item.target.type === "section"
                      ? "بخش صفحه اصلی"
                      : "نشانی دلخواه"}
              </Copy>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                <Action
                  small
                  secondary={item.target.type !== "home"}
                  onPress={() =>
                    update(placement, item.id, { target: { type: "home" } })
                  }
                >
                  صفحه اصلی
                </Action>
                <Action
                  small
                  secondary={item.target.type !== "url"}
                  onPress={() =>
                    update(placement, item.id, {
                      target: { type: "url", url: "" },
                    })
                  }
                >
                  نشانی دلخواه
                </Action>
              </View>
              <PageChoice
                pages={content.pages ?? []}
                value={
                  item.target.type === "page" ? item.target.pageId : undefined
                }
                onChange={(pageId) =>
                  update(placement, item.id, {
                    target: pageId
                      ? { type: "page", pageId }
                      : { type: "home" },
                  })
                }
              />
              <Copy muted>یا یک بخش از صفحه اصلی:</Copy>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                {content.sections
                  .filter((section) => section.enabled)
                  .map((section) => (
                    <Action
                      key={section.id}
                      small
                      secondary={
                        item.target.type !== "section" ||
                        item.target.sectionId !== section.id
                      }
                      onPress={() =>
                        update(placement, item.id, {
                          target: { type: "section", sectionId: section.id },
                        })
                      }
                    >
                      {section.title}
                    </Action>
                  ))}
              </View>
              {item.target.type === "url" && (
                <Field
                  label="نشانی مقصد"
                  value={item.target.url}
                  onChangeText={(url) =>
                    update(placement, item.id, { target: { type: "url", url } })
                  }
                  ltr
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="https://example.com"
                />
              )}
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                <Action
                  small
                  secondary
                  disabled={index === 0}
                  onPress={() => move(placement, index, -1)}
                >
                  بالاتر ↑
                </Action>
                <Action
                  small
                  secondary
                  disabled={index === navigation[placement].length - 1}
                  onPress={() => move(placement, index, 1)}
                >
                  پایین‌تر ↓
                </Action>
                <Action
                  small
                  danger
                  onPress={() =>
                    setNavigation({
                      ...navigation,
                      [placement]: navigation[placement].filter(
                        (entry) => entry.id !== item.id,
                      ),
                    })
                  }
                >
                  حذف پیوند
                </Action>
              </View>
            </Panel>
          ))}
          {navigation[placement].length === 0 && (
            <Copy muted>در این قسمت پیوندی نمایش داده نمی‌شود.</Copy>
          )}
          <Action
            secondary
            disabled={navigation[placement].length >= 100}
            onPress={() =>
              setNavigation({
                ...navigation,
                [placement]: [
                  ...navigation[placement],
                  {
                    id: uniqueId("nav"),
                    label: "صفحه اصلی",
                    target: { type: "home" },
                  },
                ],
              })
            }
          >
            + افزودن پیوند{" "}
            {placement === "header" ? "بالای سایت" : "پایین سایت"}
          </Action>
        </View>
      ))}
      <Action disabled={!valid} onPress={() => onApply(navigation)}>
        اعمال منوها در پیش‌نویس
      </Action>
      <Action secondary onPress={onClose}>
        انصراف
      </Action>
    </Screen>
  );
}

export function ContentEditor({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { site, token, updateSite } = useManager();
  const [draft, setDraft] = useState<SiteContent>(site.draft);
  const [pageId, setPageId] = useState<string>();
  const [selected, setSelected] = useState<Section>();
  const [adding, setAdding] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [editingNavigation, setEditingNavigation] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageKind, setPageKind] = useState<SitePage["kind"]>("page");
  const { busy, run } = useAction();
  useEffect(() => setDraft(site.draft), [site.id, site.updatedAt]);
  const page = draft.pages?.find((entry) => entry.id === pageId);
  const sections = page?.sections ?? draft.sections;
  const updateSections = (next: Section[], createdPages: SitePage[] = []) =>
    setDraft((current) => ({
      ...current,
      ...(page ? {} : { sections: next }),
      ...(current.pages || createdPages.length
        ? {
            pages: [
              ...(current.pages ?? []).map((entry) =>
                entry.id === page?.id ? { ...entry, sections: next } : entry,
              ),
              ...createdPages,
            ],
          }
        : {}),
    }));
  const patchPage = (partial: Partial<SitePage>) =>
    setDraft((current) => ({
      ...current,
      pages: current.pages?.map((entry) =>
        entry.id === pageId ? { ...entry, ...partial } : entry,
      ),
    }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(site.draft);
  const invalidPage = draft.pages?.find(
    (entry) =>
      !entry.title.trim() ||
      !isValidPageSlug(entry.slug) ||
      draft.pages?.some(
        (other) =>
          other.id !== entry.id &&
          normalizePageSlug(other.slug) === normalizePageSlug(entry.slug),
      ),
  );
  const validDraft =
    !!draft.brand.name.trim() &&
    /^#[0-9a-fA-F]{6}$/.test(draft.brand.primaryColor) &&
    !invalidPage;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const patchSection = (next: Section, createdPages: SitePage[] = []) =>
    updateSections(
      sections.map((section) => (section.id === next.id ? next : section)),
      createdPages,
    );
  const move = (index: number, direction: number) => {
    const list = [...sections];
    [list[index], list[index + direction]] = [
      list[index + direction],
      list[index],
    ];
    updateSections(list);
  };
  const save = async () => {
    const result = await request<{ site: Site }>(
      `/sites/${site.id}`,
      token,
      { draft: normalizeContent(draft) },
      "PATCH",
    );
    updateSite(result.site);
  };
  const publish = () =>
    confirm(
      "انتشار سایت",
      "همه صفحه‌ها و منوهای پیش‌نویس ذخیره و برای بازدیدکنندگان منتشر می‌شوند. صفحه‌های غیرفعال نمایش داده نمی‌شوند.",
      () =>
        run(async () => {
          if (dirty) await save();
          const result = await request<{ site: Site }>(
            `/sites/${site.id}/publish`,
            token,
            {},
            "POST",
          );
          updateSite(result.site);
        }, "نسخه جدید سایت شما منتشر شد."),
    );
  return (
    <>
      <Heading
        title="سایت شما، به سبک شما"
        subtitle="صفحه‌ها، بخش‌ها و پیوندهای سایت را مدیریت و همه را با هم منتشر کنید."
      />
      <Panel>
        <View style={styles.between}>
          <Text style={styles.heading}>صفحه‌های سایت</Text>
          <Text style={styles.badge}>
            {dirty ? "تغییرات ذخیره نشده" : "پیش‌نویس ذخیره شده"}
          </Text>
        </View>
        <Action
          secondary={!!page}
          disabled={busy}
          onPress={() => setPageId(undefined)}
        >
          صفحه اصلی
        </Action>
        {(draft.pages ?? []).map((entry) => (
          <Action
            key={entry.id}
            secondary={pageId !== entry.id}
            disabled={busy}
            onPress={() => setPageId(entry.id)}
          >
            {entry.title} · {pageKindLabels[entry.kind]}
            {entry.enabled ? "" : " · غیرفعال"}
          </Action>
        ))}
        <Action
          secondary
          disabled={busy || (draft.pages?.length ?? 0) >= 50}
          onPress={() => {
            setPageTitle("");
            setPageSlug("");
            setPageKind("page");
            setCreatingPage(true);
          }}
        >
          + ساخت صفحه، خدمت یا موضوع
        </Action>
        <Action
          secondary
          disabled={busy}
          onPress={() => setEditingNavigation(true)}
        >
          مدیریت منوهای بالا و پایین سایت
        </Action>
        <Copy muted>
          فعال‌بودن صفحه با حضور در منو متفاوت است. تغییر صفحه در این ویرایشگر،
          تغییرات ذخیره‌نشده شما را حفظ می‌کند.
        </Copy>
      </Panel>
      {page && (
        <Panel>
          <Heading
            title="تنظیمات این صفحه"
            subtitle="قالب و هویت برند از سایت مشترک است؛ محتوا و سئوی این صفحه مستقل‌اند."
          />
          <Field
            label="عنوان صفحه"
            value={page.title}
            editable={!busy}
            maxLength={160}
            onChangeText={(title) => patchPage({ title })}
          />
          <Field
            label="آدرس صفحه (انگلیسی)"
            value={page.slug}
            editable={!busy}
            maxLength={120}
            autoCapitalize="none"
            autoCorrect={false}
            ltr
            onChangeText={(slug) => patchPage({ slug })}
          />
          <Copy muted>
            نشانی: /s/{site.slug}/{page.slug}
          </Copy>
          <Copy muted>
            با تغییر آدرس و انتشار، آدرس قبلی دیگر باز نمی‌شود. پیوندهای داخلیِ
            انتخاب‌شده از فهرست صفحه‌ها به‌روز می‌مانند.
          </Copy>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {(
              Object.entries(pageKindLabels) as [SitePage["kind"], string][]
            ).map(([kind, label]) => (
              <Action
                key={kind}
                small
                secondary={page.kind !== kind}
                disabled={busy}
                onPress={() => patchPage({ kind })}
              >
                {label}
              </Action>
            ))}
          </View>
          <View style={styles.between}>
            <Text style={styles.text}>صفحه فعال باشد</Text>
            <Switch
              accessibilityLabel="فعال‌بودن صفحه"
              disabled={busy}
              value={page.enabled}
              onValueChange={(enabled) => patchPage({ enabled })}
              trackColor={{ true: colors.green, false: "#d9ddd4" }}
              thumbColor="#fff"
            />
          </View>
          <Copy muted>
            صفحه غیرفعال پس از انتشار، از سایت عمومی و پیوندها حذف می‌شود؛
            پیش‌نویس آن باقی می‌ماند.
          </Copy>
          <Field
            label="عنوان در موتورهای جستجو"
            value={page.seo.title}
            editable={!busy}
            maxLength={160}
            onChangeText={(title) => patchPage({ seo: { ...page.seo, title } })}
          />
          <Field
            label="توضیح در موتورهای جستجو"
            value={page.seo.description}
            editable={!busy}
            multiline
            maxLength={500}
            onChangeText={(description) =>
              patchPage({ seo: { ...page.seo, description } })
            }
          />
          <Action
            small
            danger
            disabled={busy}
            onPress={() =>
              confirm(
                "حذف صفحه",
                "این صفحه و پیوندهای داخلی آن از پیش‌نویس حذف می‌شوند. نسخه عمومی تا انتشار دوباره حفظ می‌شود.",
                () => {
                  setDraft((current) => removeSitePage(current, page.id));
                  setPageId(undefined);
                },
                true,
              )
            }
          >
            حذف این صفحه
          </Action>
        </Panel>
      )}
      {!page && (
        <Panel>
          <View style={styles.between}>
            <Text style={styles.heading}>هویت برند</Text>
            <Text style={styles.badge}>
              {dirty ? "تغییرات ذخیره نشده" : "پیش‌نویس ذخیره شده"}
            </Text>
          </View>
          <Field
            label="نام برند روی صفحه"
            editable={!busy}
            value={draft.brand.name}
            onChangeText={(name) =>
              setDraft({ ...draft, brand: { ...draft.brand, name } })
            }
          />
          <Field
            label="توضیح کوتاه برند"
            editable={!busy}
            value={draft.brand.tagline}
            onChangeText={(tagline) =>
              setDraft({ ...draft, brand: { ...draft.brand, tagline } })
            }
          />
          <Field
            label="رنگ برند (کد رنگ)"
            editable={!busy}
            value={draft.brand.primaryColor}
            ltr
            onChangeText={(primaryColor) =>
              setDraft({ ...draft, brand: { ...draft.brand, primaryColor } })
            }
            placeholder="#245b49"
            autoCapitalize="none"
          />
        </Panel>
      )}
      <View style={styles.between}>
        <Text style={styles.heading}>چیدمان {page?.title || "صفحه اصلی"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || sections.length >= 40 }}
          disabled={busy || sections.length >= 40}
          style={{ opacity: busy || sections.length >= 40 ? 0.5 : 1 }}
          onPress={() => setAdding(true)}
        >
          <Text style={styles.link}>+ افزودن بخش</Text>
        </Pressable>
      </View>
      {sections.map((section, index) => (
        <Panel key={section.id} style={{ opacity: section.enabled ? 1 : 0.65 }}>
          <View style={styles.between}>
            <View style={styles.row}>
              <Text style={[styles.muted, { color: colors.green }]}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.heading}>{sectionLabels[section.type]}</Text>
            </View>
            <Switch
              accessibilityLabel={`نمایش ${sectionLabels[section.type]}`}
              disabled={busy}
              value={section.enabled}
              onValueChange={(enabled) => patchSection({ ...section, enabled })}
              trackColor={{ true: colors.green, false: "#d9ddd4" }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.text} numberOfLines={2}>
            {section.title}
          </Text>
          <View style={styles.between}>
            <Action
              small
              secondary
              disabled={busy}
              onPress={() =>
                setSelected(JSON.parse(JSON.stringify(section)) as Section)
              }
            >
              ویرایش بخش ✎
            </Action>
            <View style={styles.row}>
              <Pressable
                accessibilityLabel="انتقال به بالا"
                accessibilityRole="button"
                disabled={busy || index === 0}
                accessibilityState={{ disabled: busy || index === 0 }}
                onPress={() => move(index, -1)}
                style={{ padding: 10, opacity: busy || index === 0 ? 0.2 : 1 }}
              >
                <Text style={{ color: colors.green, fontSize: 18 }}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="انتقال به پایین"
                accessibilityRole="button"
                disabled={busy || index === sections.length - 1}
                accessibilityState={{
                  disabled: busy || index === sections.length - 1,
                }}
                onPress={() => move(index, 1)}
                style={{
                  padding: 10,
                  opacity: busy || index === sections.length - 1 ? 0.2 : 1,
                }}
              >
                <Text style={{ color: colors.green, fontSize: 18 }}>↓</Text>
              </Pressable>
            </View>
          </View>
        </Panel>
      ))}
      <Action
        busy={busy}
        disabled={!dirty || !validDraft}
        onPress={() =>
          run(save, "پیش‌نویس ذخیره شد. برای نمایش عمومی، سایت را منتشر کنید.")
        }
      >
        ذخیره پیش‌نویس همه صفحه‌ها
      </Action>
      {invalidPage && (
        <Text style={styles.error}>
          عنوان و آدرس صفحه «{invalidPage.title || "بدون عنوان"}» را بررسی کنید.
          آدرس باید یکتا، انگلیسی و غیررزروشده باشد؛ برای مثال blog و portal
          قابل استفاده نیستند.
        </Text>
      )}
      <Action secondary busy={busy} disabled={!validDraft} onPress={publish}>
        انتشار سایت ↗
      </Action>
      <Copy muted>
        تغییرات تا زمانی که «انتشار سایت» را نزنید، در سایت عمومی نمایش داده
        نمی‌شوند.
      </Copy>
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(undefined)}
      >
        {selected && (
          <SectionEditor
            key={selected.id}
            initial={selected}
            pages={draft.pages ?? []}
            canDelete={sections.length > 1}
            onClose={() => setSelected(undefined)}
            onSave={(section, createdPages) => {
              patchSection(section, createdPages);
              setSelected(undefined);
            }}
            onDelete={() => {
              const remaining = sections.filter((s) => s.id !== selected.id);
              updateSections(remaining);
              if (!page && draft.navigation)
                setDraft((current) => ({
                  ...current,
                  navigation: current.navigation
                    ? {
                        header: current.navigation.header.filter(
                          (item) =>
                            item.target.type !== "section" ||
                            item.target.sectionId !== selected.id,
                        ),
                        footer: current.navigation.footer.filter(
                          (item) =>
                            item.target.type !== "section" ||
                            item.target.sectionId !== selected.id,
                        ),
                      }
                    : undefined,
                }));
              setSelected(undefined);
            }}
          />
        )}
      </Modal>
      <Modal
        visible={adding}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAdding(false)}
      >
        <Screen title="افزودن بخش" onBack={() => setAdding(false)}>
          <Heading title="چه چیزی به صفحه اضافه کنیم؟" />
          {(Object.entries(sectionLabels) as [SectionType, string][]).map(
            ([type, label]) => (
              <Action
                key={type}
                secondary
                disabled={busy}
                onPress={() => {
                  const section: Section = {
                    id: `${type}-${Date.now()}`,
                    type,
                    title: label,
                    subtitle: "",
                    enabled: true,
                    items: [],
                  };
                  updateSections([...sections, section]);
                  setAdding(false);
                  setSelected(section);
                }}
              >
                {label} +
              </Action>
            ),
          )}
        </Screen>
      </Modal>
      <Modal
        visible={creatingPage}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreatingPage(false)}
      >
        <Screen title="صفحه جدید" onBack={() => setCreatingPage(false)}>
          <Heading
            title="برای هر موضوع، یک صفحه"
            subtitle="صفحه جدید ابتدا در پیش‌نویس سایت ساخته می‌شود. جای نمایش پیوند آن را از منوهای سایت انتخاب کنید."
          />
          <Panel>
            <Field
              label="عنوان صفحه جدید"
              value={pageTitle}
              maxLength={160}
              onChangeText={setPageTitle}
              placeholder="مثلاً طراحی داخلی"
            />
            <Field
              label="آدرس صفحه جدید (انگلیسی)"
              value={pageSlug}
              maxLength={120}
              onChangeText={setPageSlug}
              ltr
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="interior-design"
            />
            <Copy muted>
              حروف انگلیسی کوچک، عدد و خط تیره؛ آدرس هر صفحه در این سایت یکتا
              است.
            </Copy>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {(
                Object.entries(pageKindLabels) as [SitePage["kind"], string][]
              ).map(([kind, label]) => (
                <Action
                  key={kind}
                  small
                  secondary={pageKind !== kind}
                  onPress={() => setPageKind(kind)}
                >
                  {label}
                </Action>
              ))}
            </View>
          </Panel>
          <Action
            disabled={
              !pageTitle.trim() ||
              !isValidPageSlug(pageSlug) ||
              !!draft.pages?.some(
                (entry) =>
                  normalizePageSlug(entry.slug) === normalizePageSlug(pageSlug),
              )
            }
            onPress={() => {
              const created = createSitePage({
                title: pageTitle.trim(),
                slug: pageSlug,
                kind: pageKind,
                id: uniqueId("page"),
              });
              setDraft((current) => ({
                ...current,
                pages: [...(current.pages ?? []), created],
              }));
              setPageId(created.id);
              setCreatingPage(false);
            }}
          >
            ساخت و ویرایش صفحه
          </Action>
          {!!pageSlug && !isValidPageSlug(pageSlug) && (
            <Copy muted>
              آدرس باید انگلیسی و غیررزروشده باشد؛ برای مثال blog و portal قابل
              استفاده نیستند.
            </Copy>
          )}
          {draft.pages?.some(
            (entry) =>
              normalizePageSlug(entry.slug) === normalizePageSlug(pageSlug),
          ) && <Copy muted>این آدرس قبلاً برای یک صفحه استفاده شده است.</Copy>}
        </Screen>
      </Modal>
      <Modal
        visible={editingNavigation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingNavigation(false)}
      >
        {editingNavigation && (
          <NavigationEditor
            content={draft}
            onClose={() => setEditingNavigation(false)}
            onApply={(navigation) => {
              setDraft((current) => ({ ...current, navigation }));
              setEditingNavigation(false);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function SectionEditor({
  initial,
  pages,
  canDelete,
  onSave,
  onClose,
  onDelete,
}: {
  initial: Section;
  pages: SitePage[];
  canDelete: boolean;
  onSave: (section: Section, createdPages: SitePage[]) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { token, site } = useManager();
  const [section, setSection] = useState(initial);
  const [createdPages, setCreatedPages] = useState<SitePage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [showAi, setShowAi] = useState(false);
  const { busy, run } = useAction();
  const change = (partial: Partial<Section>) =>
    setSection((current) => ({ ...current, ...partial }));
  const itemChange = (id: string, partial: Partial<SectionItem>) =>
    setSection((current) => ({
      ...current,
      items: current.items?.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));
  const hasItems = [
    "services",
    "stories",
    "testimonials",
    "faq",
    "instagram",
  ].includes(section.type);
  const availablePages = [...pages, ...createdPages];
  const createItemPage = (item: SectionItem, kind: "service" | "topic") => {
    const id = uniqueId("page");
    const created = createSitePage({
      title: item.title.trim().slice(0, 160),
      kind,
      slug: `${kind}-${id.slice(5)}`,
      id,
    });
    created.sections = created.sections.map((entry) =>
      entry.type === "hero"
        ? {
            ...entry,
            title: item.title.trim(),
            subtitle: item.description || "",
            image: item.image,
          }
        : entry,
    );
    setCreatedPages((current) => [...current, created]);
    itemChange(item.id, { pageId: created.id, url: undefined });
  };
  const canHaveImage = ["hero", "about"].includes(section.type);
  const uploadImage = (itemId?: string) =>
    run(async () => {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled) return;
      const file = picked.assets[0];
      const form = new FormData();
      (
        form as unknown as { append: (name: string, value: unknown) => void }
      ).append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "image/jpeg",
      });
      const result = await request<{ media: { url: string } }>(
        `/sites/${site.id}/media`,
        token,
        form,
        "POST",
      );
      if (itemId) itemChange(itemId, { image: publicMedia(result.media.url) });
      else change({ image: publicMedia(result.media.url) });
    });
  return (
    <Screen title={sectionLabels[section.type]} onBack={onClose}>
      <Heading
        title="جزئیات، تفاوت می‌سازند"
        subtitle="این تغییرات ابتدا در پیش‌نویس شما قرار می‌گیرند."
      />
      <Panel>
        <Field
          label="عنوان بخش"
          value={section.title}
          onChangeText={(title) => change({ title })}
          multiline
        />
        <Field
          label="توضیح بخش"
          value={section.subtitle || ""}
          onChangeText={(subtitle) => change({ subtitle })}
          multiline
        />
        {canHaveImage && (
          <>
            {!!section.image && (
              <Image
                source={{ uri: publicMedia(section.image) }}
                style={styles.image}
              />
            )}
            <Field
              label="نشانی تصویر"
              value={section.image || ""}
              onChangeText={(image) => change({ image: image || undefined })}
              ltr
              keyboardType="url"
              autoCapitalize="none"
            />
            <Action secondary busy={busy} onPress={() => uploadImage()}>
              انتخاب و بهینه‌سازی تصویر ↑
            </Action>
            <Action secondary onPress={() => setShowAi(!showAi)}>
              ✦ ساخت تصویر با هوش مصنوعی
            </Action>
            {showAi && (
              <View style={styles.stack}>
                <Field
                  label="تصویر دلخواه را توصیف کنید"
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  placeholder="فضای مینیمال و روشن، نور طبیعی، رنگ‌های گرم..."
                />
                <Copy muted>
                  این قابلیت به اتصال سرویس تولید تصویر نیاز دارد. تصویر فعلی تا
                  دریافت نتیجه تغییر نمی‌کند.
                </Copy>
                <Action
                  busy={busy}
                  disabled={prompt.trim().length < 10}
                  onPress={() =>
                    run(async () => {
                      const result = await request<{ media: { url: string } }>(
                        `/sites/${site.id}/ai/image`,
                        token,
                        { prompt },
                        "POST",
                      );
                      change({ image: publicMedia(result.media.url) });
                    })
                  }
                >
                  تولید تصویر
                </Action>
              </View>
            )}
          </>
        )}
        {["hero", "about", "contact"].includes(section.type) && (
          <Field
            label="متن دکمه"
            value={section.buttonText || ""}
            onChangeText={(buttonText) => change({ buttonText })}
          />
        )}
        {["hero", "about"].includes(section.type) && (
          <>
            <PageChoice
              pages={availablePages}
              value={section.buttonPageId}
              disabled={busy}
              onChange={(buttonPageId) =>
                change({ buttonPageId, buttonUrl: undefined })
              }
            />
            <Field
              label="نشانی دکمه (اختیاری)"
              value={section.buttonUrl || ""}
              editable={!busy && !section.buttonPageId}
              onChangeText={(buttonUrl) =>
                change({ buttonUrl: buttonUrl || undefined })
              }
              ltr
              placeholder="#contact"
              autoCapitalize="none"
            />
          </>
        )}
        {section.type === "blog" && (
          <Copy muted>
            مقاله‌های منتشرشده از قسمت بلاگ در این بخش نمایش داده می‌شوند.
          </Copy>
        )}
        {section.type === "contact" && (
          <Copy muted>
            فرم‌ها را از قسمت ابزارها ← فرم‌های ارتباط مدیریت کنید.
          </Copy>
        )}
      </Panel>
      {hasItems && (
        <>
          <Text style={styles.heading}>
            {section.type === "faq"
              ? "سوال‌ها و پاسخ‌ها"
              : section.type === "stories"
                ? "استوری‌ها"
                : "آیتم‌های بخش"}
          </Text>
          {(section.items || []).map((item, index) => (
            <Panel key={item.id}>
              <View style={styles.between}>
                <Text style={styles.badge}>آیتم {index + 1}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    change({
                      items: section.items?.filter((s) => s.id !== item.id),
                    })
                  }
                >
                  <Text style={[styles.link, { color: colors.red }]}>حذف</Text>
                </Pressable>
              </View>
              <Field
                label={section.type === "faq" ? "سوال" : "عنوان"}
                value={item.title}
                onChangeText={(title) => itemChange(item.id, { title })}
              />
              <Field
                label={section.type === "faq" ? "پاسخ" : "توضیح"}
                value={item.description || ""}
                onChangeText={(description) =>
                  itemChange(item.id, { description })
                }
                multiline
              />
              {["services", "stories", "instagram"].includes(section.type) && (
                <>
                  {!!item.image && (
                    <Image
                      source={{ uri: publicMedia(item.image) }}
                      style={[styles.image, { height: 150 }]}
                      accessibilityLabel={item.title}
                    />
                  )}
                  <Field
                    label="نشانی تصویر"
                    value={item.image || ""}
                    onChangeText={(image) =>
                      itemChange(item.id, { image: image || undefined })
                    }
                    ltr
                    autoCapitalize="none"
                  />
                  <Action
                    secondary
                    busy={busy}
                    onPress={() => uploadImage(item.id)}
                  >
                    انتخاب و بهینه‌سازی تصویر ↑
                  </Action>
                  <Field
                    label={
                      section.type === "instagram"
                        ? "پیوند پست اینستاگرام"
                        : "پیوند (اختیاری)"
                    }
                    value={item.url || ""}
                    editable={!busy && !item.pageId}
                    onChangeText={(url) =>
                      itemChange(item.id, { url: url || undefined })
                    }
                    ltr
                    autoCapitalize="none"
                  />
                  {section.type !== "instagram" && (
                    <>
                      <PageChoice
                        pages={availablePages}
                        value={item.pageId}
                        disabled={busy}
                        onChange={(pageId) =>
                          itemChange(item.id, { pageId, url: undefined })
                        }
                      />
                      <View style={[styles.row, { flexWrap: "wrap" }]}>
                        <Action
                          small
                          secondary
                          disabled={
                            busy ||
                            !item.title.trim() ||
                            availablePages.length >= 50
                          }
                          onPress={() => createItemPage(item, "service")}
                        >
                          ساخت صفحه خدمت برای این آیتم
                        </Action>
                        <Action
                          small
                          secondary
                          disabled={
                            busy ||
                            !item.title.trim() ||
                            availablePages.length >= 50
                          }
                          onPress={() => createItemPage(item, "topic")}
                        >
                          ساخت صفحه موضوع برای این آیتم
                        </Action>
                      </View>
                      {createdPages.some((page) => page.id === item.pageId) && (
                        <Copy muted>
                          صفحه همراه با اعمال این بخش ساخته می‌شود. سپس از فهرست
                          صفحه‌ها، آدرس، محتوا و سئوی آن را تکمیل کنید.
                        </Copy>
                      )}
                    </>
                  )}
                </>
              )}
            </Panel>
          ))}
          <Action
            secondary
            disabled={busy || (section.items?.length ?? 0) >= 40}
            onPress={() =>
              change({
                items: [
                  ...(section.items || []),
                  { id: `item-${Date.now()}`, title: "", description: "" },
                ],
              })
            }
          >
            + افزودن {section.type === "faq" ? "سوال" : "آیتم"}
          </Action>
        </>
      )}
      <Action
        disabled={busy || !section.title.trim()}
        onPress={() => onSave(section, createdPages)}
      >
        اعمال در پیش‌نویس ←
      </Action>
      <Action secondary onPress={onClose}>
        انصراف
      </Action>
      <Action
        danger
        disabled={busy || !canDelete}
        onPress={() =>
          confirm(
            "حذف بخش",
            "این بخش از پیش‌نویس صفحه حذف می‌شود.",
            onDelete,
            true,
          )
        }
      >
        حذف این بخش
      </Action>
      {!canDelete && <Copy muted>هر صفحه باید دست‌کم یک بخش داشته باشد.</Copy>}
    </Screen>
  );
}

export function TemplatesScreen() {
  const { site, token, updateSite } = useManager();
  const { busy, run } = useAction();
  return (
    <>
      <Heading
        title="یک حال‌وهوای تازه"
        subtitle="پنج قالب مستقل؛ هر کدام شروع یک داستان متفاوت."
      />
      {templates.map((template) => (
        <Panel
          key={template.id}
          style={{
            borderColor:
              template.id === site.templateId ? colors.green : colors.line,
          }}
        >
          <Image
            source={{ uri: publicMedia(template.image) }}
            style={[
              styles.image,
              {
                height: 210,
                borderTopLeftRadius: template.id === "bloom" ? 90 : 18,
              },
            ]}
          />
          <View style={styles.between}>
            <Text style={styles.title}>{template.name}</Text>
            <Text
              style={[
                styles.badge,
                {
                  backgroundColor:
                    template.id === "forma" ? "#172b33" : colors.pale,
                  color: template.id === "forma" ? "#d5f778" : colors.green,
                },
              ]}
            >
              {template.englishName}
            </Text>
          </View>
          <Copy>{template.description}</Copy>
          <Copy muted>
            {template.category} · {template.tags.join(" / ")}
          </Copy>
          <Action
            secondary
            busy={busy}
            onPress={() =>
              confirm(
                "فعال‌سازی قالب",
                "محتوای صفحه اصلی با محتوای اولیه این قالب جایگزین می‌شود. صفحه‌های اضافه حفظ و با قالب جدید نمایش داده می‌شوند. سایت منتشرشده تا انتشار بعدی حفظ می‌شود.",
                () =>
                  run(async () => {
                    const result = await request<{ site: Site }>(
                      `/sites/${site.id}/template`,
                      token,
                      { templateId: template.id },
                      "POST",
                    );
                    updateSite(result.site);
                  }, "قالب در پیش‌نویس فعال شد. محتوای آن را شخصی‌سازی و سپس منتشر کنید."),
              )
            }
          >
            {template.id === site.templateId
              ? "بازنشانی قالب فعلی"
              : `انتخاب قالب ${template.name} ←`}
          </Action>
        </Panel>
      ))}
    </>
  );
}

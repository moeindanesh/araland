import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, Switch, View } from "react-native";
import { Text } from "./typography";
import * as DocumentPicker from "expo-document-picker";
import {
  sectionLabels,
  templates,
  type Section,
  type SectionItem,
  type SectionType,
  type Site,
  type SiteContent,
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

export function ContentEditor({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { site, token, updateSite } = useManager();
  const [draft, setDraft] = useState<SiteContent>(site.draft);
  const [selected, setSelected] = useState<Section>();
  const [adding, setAdding] = useState(false);
  const { busy, run } = useAction();
  useEffect(() => setDraft(site.draft), [site.id, site.updatedAt]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(site.draft);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const patchSection = (next: Section) =>
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === next.id ? next : section,
      ),
    }));
  const move = (index: number, direction: number) => {
    const list = [...draft.sections];
    [list[index], list[index + direction]] = [
      list[index + direction],
      list[index],
    ];
    setDraft({ ...draft, sections: list });
  };
  const save = async () => {
    const result = await request<{ site: Site }>(
      `/sites/${site.id}`,
      token,
      { draft },
      "PATCH",
    );
    updateSite(result.site);
  };
  const publish = () =>
    confirm(
      "انتشار سایت",
      "نسخه پیش‌نویس ذخیره و برای همه بازدیدکنندگان منتشر می‌شود.",
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
        subtitle="بخش‌ها را ویرایش کنید، جابه‌جا کنید و هر وقت آماده بودید منتشر کنید."
      />
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
      <View style={styles.between}>
        <Text style={styles.heading}>چیدمان صفحه</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          style={{ opacity: busy ? 0.5 : 1 }}
          onPress={() => setAdding(true)}
        >
          <Text style={styles.link}>+ افزودن بخش</Text>
        </Pressable>
      </View>
      {draft.sections.map((section, index) => (
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
                disabled={busy || index === draft.sections.length - 1}
                accessibilityState={{
                  disabled: busy || index === draft.sections.length - 1,
                }}
                onPress={() => move(index, 1)}
                style={{
                  padding: 10,
                  opacity: busy || index === draft.sections.length - 1 ? 0.2 : 1,
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
        disabled={
          !dirty ||
          !draft.brand.name.trim() ||
          !/^#[0-9a-fA-F]{6}$/.test(draft.brand.primaryColor)
        }
        onPress={() =>
          run(save, "پیش‌نویس ذخیره شد. برای نمایش عمومی، سایت را منتشر کنید.")
        }
      >
        ذخیره پیش‌نویس
      </Action>
      <Action secondary busy={busy} onPress={publish}>
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
            onClose={() => setSelected(undefined)}
            onSave={(section) => {
              patchSection(section);
              setSelected(undefined);
            }}
            onDelete={() => {
              setDraft({
                ...draft,
                sections: draft.sections.filter((s) => s.id !== selected.id),
              });
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
                  setDraft({
                    ...draft,
                    sections: [...draft.sections, section],
                  });
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
    </>
  );
}

function SectionEditor({
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  initial: Section;
  onSave: (section: Section) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { token, site } = useManager();
  const [section, setSection] = useState(initial);
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
        {["hero", "contact"].includes(section.type) && (
          <Field
            label="متن دکمه"
            value={section.buttonText || ""}
            onChangeText={(buttonText) => change({ buttonText })}
          />
        )}
        {section.type === "hero" && (
          <Field
            label="نشانی دکمه"
            value={section.buttonUrl || ""}
            onChangeText={(buttonUrl) =>
              change({ buttonUrl: buttonUrl || undefined })
            }
            ltr
            placeholder="#contact"
            autoCapitalize="none"
          />
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
                    onChangeText={(url) =>
                      itemChange(item.id, { url: url || undefined })
                    }
                    ltr
                    autoCapitalize="none"
                  />
                </>
              )}
            </Panel>
          ))}
          <Action
            secondary
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
      <Action disabled={!section.title.trim()} onPress={() => onSave(section)}>
        اعمال در پیش‌نویس ←
      </Action>
      <Action secondary onPress={onClose}>
        انصراف
      </Action>
      <Action
        danger
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
        subtitle="سه قالب مستقل؛ هر کدام شروع یک داستان متفاوت."
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
            source={{ uri: template.image }}
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
                "پیش‌نویس فعلی با محتوای اولیه این قالب جایگزین می‌شود. سایت منتشرشده تا انتشار بعدی حفظ می‌شود.",
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

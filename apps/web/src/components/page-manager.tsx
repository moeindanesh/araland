"use client";

import { useEffect, useState } from "react";
import {
  SiteContent,
  SitePage,
  PageKind,
  NavigationItem,
  NavigationTarget,
  createSitePage,
  removeSitePage,
  isValidPageSlug,
  normalizePageSlug,
  pageKindLabels,
} from "@araland/shared";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  ActionButton,
  Button,
  CheckboxField,
  Input,
  Modal,
  Notice,
  SelectField,
  TextArea,
} from "./ui";

export function CreatePageDialog({
  onClose,
  onCreate,
  pages,
  initialTitle = "",
  initialKind = "page",
}: {
  onClose: () => void;
  onCreate: (page: SitePage) => void;
  pages: SitePage[];
  initialTitle?: string;
  initialKind?: PageKind;
}) {
  const [title, setTitle] = useState(initialTitle.slice(0, 160));
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<PageKind>(initialKind);
  const [error, setError] = useState("");
  return (
    <Modal title="افزودن صفحه" onClose={onClose}>
      <form
        className="stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          const address = normalizePageSlug(slug);
          if (!title.trim() || title.trim().length > 160)
            return setError("عنوان صفحه را بین ۱ تا ۱۶۰ نویسه وارد کن.");
          if (!isValidPageSlug(address))
            return setError(
              "آدرس معتبر وارد کن؛ حروف انگلیسی کوچک، عدد و خط تیره. نام‌های سیستمی مثل blog قابل استفاده نیستند.",
            );
          if (pages.some((page) => page.slug === address))
            return setError("این آدرس در همین سایت استفاده شده است.");
          onCreate(
            createSitePage({ title: title.trim(), slug: address, kind }),
          );
        }}
      >
        <label>
          عنوان صفحه
          <Input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
          />
        </label>
        <label>
          آدرس صفحه
          <Input
            required
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="interior-design"
            maxLength={120}
          />
        </label>
        <SelectField
          label="نوع صفحه"
          value={kind}
          onChange={(value) => setKind(value as PageKind)}
          options={Object.entries(pageKindLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <p className="editor-hint">
          صفحه ابتدا در پیش‌نویس ساخته می‌شود. برای نمایش عمومی، سایت را منتشر
          کن. لینک منو را جداگانه اضافه کن.
        </p>
        <Notice message={error} error />
        <Button>
          <Plus size={16} />
          ساخت صفحه
        </Button>
      </form>
    </Modal>
  );
}

export function InternalPageLink({
  pages,
  pageId,
  onChange,
  disabled,
  label = "صفحهٔ مقصد",
}: {
  pages: SitePage[];
  pageId?: string;
  onChange: (pageId: string | undefined) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <SelectField
      label={label}
      value={pageId || "url"}
      onChange={(value) => onChange(value === "url" ? undefined : value)}
      disabled={disabled}
      options={[
        { value: "url", label: "پیوند دستی / بدون صفحه" },
        ...pages.map((page) => ({
          value: page.id,
          label: `${page.title}${page.enabled ? "" : " (غیرفعال)"}`,
        })),
      ]}
    />
  );
}

export function PageManager({
  content,
  selectedPageId,
  onChange,
  onSelect,
  onEdit,
  disabled,
  hasPosts,
  menuIssue,
}: {
  content: SiteContent;
  selectedPageId: string;
  onChange: (content: SiteContent) => void;
  onSelect: (id: string) => void;
  onEdit: () => void;
  disabled: boolean;
  hasPosts: boolean;
  menuIssue?: { placement: "header" | "footer"; field: string };
}) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<SitePage | null>(null);
  const pages = content.pages || [];
  const selected = pages.find((page) => page.id === selectedPageId);
  const update = (patch: Partial<SitePage>) =>
    onChange({
      ...content,
      pages: pages.map((page) =>
        page.id === selectedPageId ? { ...page, ...patch } : page,
      ),
    });
  return (
    <div className="page-manager stack-form">
      <div className="section-list-title">
        <b>صفحه‌های سایت ({(pages.length + 1).toLocaleString("fa-IR")})</b>
        <ActionButton
          className="text-btn"
          disabled={disabled || pages.length >= 50}
          onClick={() => setAdding(true)}
        >
          <Plus size={14} />
          افزودن صفحه
        </ActionButton>
      </div>
      <p className="editor-hint">
        هر صفحه محتوای مستقل دارد. ذخیره و انتشار، همهٔ صفحه‌ها و منوهای سایت را
        با هم به‌روز می‌کند.
      </p>
      <div className="page-list">
        <ActionButton
          className={`page-list-item ${!selectedPageId ? "active" : ""}`}
          disabled={disabled}
          onClick={() => onSelect("")}
          aria-pressed={!selectedPageId}
        >
          صفحهٔ اصلی <small>همیشگی</small>
        </ActionButton>
        {pages.map((page) => (
          <ActionButton
            key={page.id}
            className={`page-list-item ${page.id === selectedPageId ? "active" : ""}`}
            aria-pressed={page.id === selectedPageId}
            disabled={disabled}
            onClick={() => onSelect(page.id)}
          >
            <span>
              {page.title}
              <small dir="ltr">/{page.slug}</small>
            </span>
            <small>
              {pageKindLabels[page.kind]} · {page.enabled ? "فعال" : "غیرفعال"}
            </small>
          </ActionButton>
        ))}
      </div>
      {selected ? (
        <div className="page-settings stack-form">
          <h3>تنظیمات {selected.title}</h3>
          <label>
            عنوان صفحه
            <Input
              id="page-title"
              value={selected.title}
              disabled={disabled}
              maxLength={160}
              onChange={(e) => update({ title: e.target.value })}
            />
          </label>
          <label>
            آدرس صفحه
            <Input
              id="page-slug"
              dir="ltr"
              value={selected.slug}
              disabled={disabled}
              maxLength={120}
              onChange={(e) =>
                update({ slug: normalizePageSlug(e.target.value) })
              }
            />
          </label>
          <p className="editor-hint">
            آدرس انگلیسی، مثل interior-design. با تغییر آدرس و انتشار، لینک
            قدیمی دیگر باز نمی‌شود؛ لینک‌های داخلی انتخاب‌شده خودکار به‌روز
            می‌شوند.
          </p>
          <SelectField
            label="نوع صفحه"
            value={selected.kind}
            onChange={(value) => update({ kind: value as PageKind })}
            disabled={disabled}
            options={Object.entries(pageKindLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <CheckboxField
            checked={selected.enabled}
            disabled={disabled}
            onChange={(enabled) => update({ enabled })}
          >
            صفحه پس از انتشار در دسترس باشد
          </CheckboxField>
          {!selected.enabled && (
            <p className="editor-hint">
              با انتشار بعدی، صفحه و لینک‌های آن از سایت عمومی پنهان می‌شوند.
              محتوای پیش‌نویس باقی می‌ماند.
            </p>
          )}
          <label>
            عنوان در جستجو
            <Input
              value={selected.seo.title}
              disabled={disabled}
              maxLength={160}
              onChange={(e) =>
                update({ seo: { ...selected.seo, title: e.target.value } })
              }
            />
          </label>
          <label>
            توضیحات در جستجو
            <TextArea
              value={selected.seo.description}
              disabled={disabled}
              maxLength={500}
              rows={3}
              onChange={(e) =>
                update({
                  seo: { ...selected.seo, description: e.target.value },
                })
              }
            />
          </label>
          <Button type="button" disabled={disabled} onClick={onEdit}>
            ویرایش بخش‌های این صفحه
          </Button>
          <ActionButton
            className="text-btn danger"
            disabled={disabled}
            onClick={() => setDeleting(selected)}
          >
            <Trash2 size={14} />
            حذف صفحه
          </ActionButton>
        </div>
      ) : (
        <Button
          type="button"
          className="btn-outline"
          disabled={disabled}
          onClick={onEdit}
        >
          ویرایش بخش‌های صفحهٔ اصلی
        </Button>
      )}
      <MenuManager
        content={content}
        onChange={onChange}
        disabled={disabled}
        hasPosts={hasPosts}
        issue={menuIssue}
      />
      {adding && (
        <CreatePageDialog
          pages={pages}
          onClose={() => setAdding(false)}
          onCreate={(page) => {
            onChange({ ...content, pages: [...pages, page] });
            onSelect(page.id);
            setAdding(false);
          }}
        />
      )}
      {deleting && (
        <Modal title="حذف صفحه" onClose={() => setDeleting(null)}>
          <div className="stack-form">
            <p>
              صفحهٔ «{deleting.title}» و لینک‌های داخلی وابسته از پیش‌نویس حذف
              شوند؟ نسخهٔ عمومی تا انتشار دوباره باقی می‌ماند.
            </p>
            <div className="dialog-actions">
              <Button
                type="button"
                className="btn-outline"
                autoFocus
                onClick={() => setDeleting(null)}
              >
                انصراف
              </Button>
              <Button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onChange(removeSitePage(content, deleting.id));
                  onSelect("");
                  setDeleting(null);
                }}
              >
                حذف صفحه و لینک‌ها
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MenuManager({
  content,
  onChange,
  disabled,
  hasPosts,
  issue,
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
  disabled: boolean;
  hasPosts: boolean;
  issue?: { placement: "header" | "footer"; field: string };
}) {
  const [placement, setPlacement] = useState<"header" | "footer">("header");
  useEffect(() => {
    if (issue) setPlacement(issue.placement);
  }, [issue]);
  useEffect(() => {
    if (!issue || placement !== issue.placement) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(issue.field)?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [placement, issue]);
  const menu = content.navigation?.[placement] || [];
  const updateMenu = (items: NavigationItem[]) =>
    onChange({
      ...content,
      navigation: {
        header: content.navigation?.header || [],
        footer: content.navigation?.footer || [],
        [placement]: items,
      },
    });
  const updateItem = (id: string, patch: Partial<NavigationItem>) =>
    updateMenu(
      menu.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const targets = [
    { value: "home", label: "صفحهٔ اصلی" },
    ...(content.pages || []).map((page) => ({
      value: `page:${page.id}`,
      label: `${page.title}${page.enabled ? "" : " (غیرفعال)"}`,
    })),
    ...content.sections.map((section) => ({
      value: `section:${section.id}`,
      label: `بخش اصلی: ${section.title}${section.enabled ? "" : " (پنهان)"}`,
    })),
    { value: "url", label: "پیوند دستی" },
  ];
  const targetKey = (target: NavigationTarget) =>
    target.type === "page"
      ? `page:${target.pageId}`
      : target.type === "section"
        ? `section:${target.sectionId}`
        : target.type;
  function changeTarget(item: NavigationItem, value: string) {
    let target: NavigationTarget = { type: "home" };
    if (value.startsWith("page:"))
      target = { type: "page", pageId: value.slice(5) };
    else if (value.startsWith("section:"))
      target = { type: "section", sectionId: value.slice(8) };
    else if (value === "url") target = { type: "url", url: "https://" };
    const label = targets
      .find((option) => option.value === value)
      ?.label.slice(0, 100)
      .replace("بخش اصلی: ", "")
      .replace(" (غیرفعال)", "")
      .replace(" (پنهان)", "");
    updateItem(item.id, {
      target,
      ...(label && value !== "url" ? { label } : {}),
    });
  }
  return (
    <section className="menu-manager stack-form" aria-label="مدیریت منوها">
      <h3>منوها و لینک‌های سایت</h3>
      <p className="editor-hint">
        قرار دادن صفحه در منو اختیاری است. ترتیب لینک‌ها را با فلش‌ها تغییر بده؛
        منوها در همهٔ صفحه‌ها مشترک‌اند.
      </p>
      {!content.navigation ? (
        <>
          <p className="editor-hint">
            منوی خودکار بخش‌های صفحهٔ اصلی فعال است.
          </p>
          <Button
            type="button"
            className="btn-outline"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...content,
                navigation: {
                  header: (
                    [
                      ["services", "خدمات ما"],
                      ["about", "درباره ما"],
                      ["blog", "خواندنی‌ها"],
                      ["contact", "در ارتباط باشیم"],
                    ] as const
                  ).flatMap(([type, label]) => {
                    const section = content.sections.find(
                      (section) =>
                        section.type === type &&
                        section.enabled &&
                        (type !== "blog" ||
                          hasPosts ||
                          !!section.items?.length),
                    );
                    return section
                      ? [
                          {
                            id: crypto.randomUUID(),
                            label,
                            target: {
                              type: "section" as const,
                              sectionId: section.id,
                            },
                          },
                        ]
                      : [];
                  }),
                  footer: content.sections
                    .filter(
                      (section) =>
                        section.enabled && section.type === "contact",
                    )
                    .slice(0, 1)
                    .map((section) => ({
                      id: crypto.randomUUID(),
                      label: "تماس با ما",
                      target: {
                        type: "section" as const,
                        sectionId: section.id,
                      },
                    })),
                },
              })
            }
          >
            سفارشی‌کردن منوها
          </Button>
        </>
      ) : (
        <>
          <SelectField
            label="محل نمایش منو"
            value={placement}
            onChange={(value) => setPlacement(value as "header" | "footer")}
            options={[
              { value: "header", label: "بالای سایت" },
              { value: "footer", label: "پایین سایت" },
            ]}
          />
          {!menu.length && (
            <p className="editor-hint">
              این منو خالی است؛ لینکی در این محل نمایش داده نمی‌شود.
            </p>
          )}
          {menu.map((item, index) => (
            <div className="menu-item stack-form" key={item.id}>
              <div className="section-list-title">
                <b>لینک {(index + 1).toLocaleString("fa-IR")}</b>
                <div className="menu-item-actions">
                  {[-1, 1].map((delta) => (
                    <ActionButton
                      key={delta}
                      aria-label={`${delta < 0 ? "بالا" : "پایین"} بردن لینک ${item.label}`}
                      disabled={
                        disabled ||
                        index + delta < 0 ||
                        index + delta >= menu.length
                      }
                      onClick={() => {
                        const next = [...menu];
                        [next[index], next[index + delta]] = [
                          next[index + delta],
                          next[index],
                        ];
                        updateMenu(next);
                      }}
                    >
                      {delta < 0 ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )}
                    </ActionButton>
                  ))}
                  <ActionButton
                    aria-label={`حذف لینک ${item.label}`}
                    disabled={disabled}
                    onClick={() =>
                      updateMenu(menu.filter((link) => link.id !== item.id))
                    }
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </div>
              <label>
                متن لینک
                <Input
                  id={`menu-${placement}-${item.id}-label`}
                  aria-invalid={
                    issue?.field === `menu-${placement}-${item.id}-label` ||
                    undefined
                  }
                  value={item.label}
                  disabled={disabled}
                  maxLength={100}
                  onChange={(e) =>
                    updateItem(item.id, { label: e.target.value })
                  }
                />
              </label>
              <SelectField
                label="مقصد لینک"
                value={targetKey(item.target)}
                disabled={disabled}
                options={targets}
                onChange={(value) => changeTarget(item, value)}
              />
              {item.target.type === "url" && (
                <label>
                  نشانی لینک
                  <Input
                    id={`menu-${placement}-${item.id}-url`}
                    aria-invalid={
                      issue?.field === `menu-${placement}-${item.id}-url` ||
                      undefined
                    }
                    dir="ltr"
                    value={item.target.url}
                    disabled={disabled}
                    maxLength={2048}
                    onChange={(e) =>
                      updateItem(item.id, {
                        target: { type: "url", url: e.target.value },
                      })
                    }
                  />
                </label>
              )}
            </div>
          ))}
          <Button
            type="button"
            className="btn-outline"
            disabled={disabled || menu.length >= 100}
            onClick={() =>
              updateMenu([
                ...menu,
                {
                  id: crypto.randomUUID(),
                  label: "صفحهٔ اصلی",
                  target: { type: "home" },
                },
              ])
            }
          >
            <Plus size={14} />
            افزودن لینک به منو
          </Button>
        </>
      )}
    </section>
  );
}

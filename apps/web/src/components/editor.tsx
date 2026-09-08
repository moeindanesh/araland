"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Accordion, Spinner, Tabs } from "@heroui/react";
import {
  Site,
  SiteForm,
  Post,
  Section,
  SectionType,
  sectionLabels,
  createDemoSite,
  templates,
  createContent,
  createInitialContent,
  TemplateId,
  normalizeContent,
  SiteContent,
  SitePage,
  SectionItem,
  isValidPageSlug,
} from "@araland/shared";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Upload,
  ChevronDown,
  Trash2,
  Save,
  ExternalLink,
  Palette,
  LayoutTemplate,
  Settings2,
} from "lucide-react";
import {
  PageManager,
  CreatePageDialog,
  InternalPageLink,
} from "./page-manager";
import {
  ActionButton,
  Button,
  Input,
  Notice,
  Modal,
  TextArea,
  SelectField,
} from "./ui";
import { request, json, getToken } from "@/lib/client";
type EditorIssue = {
  field: string;
  message: string;
  sectionId?: string;
  itemId?: string;
  pageId?: string;
  tab?: string;
  menuPlacement?: "header" | "footer";
};
function editableSnapshot(site: Site) {
  return JSON.stringify({
    templateId: site.templateId,
    draft: normalizeContent(site.draft),
    name: site.name,
    seo: site.seo,
  });
}
function draftIssue(site: Site): EditorIssue | null {
  if (!site.draft.brand.name.trim())
    return { field: "editor-brand-name", message: "نام برند را وارد کن." };
  const imagePattern = /^(https?:\/\/[^\s]+|\/api\/media\/[^\s]+|\/images\/templates\/[a-z0-9-]+\.webp)$/;
  const linkPattern =
    /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+0-9 -]+|\/(?!\/)[^\s]*|#[^\s]*)$/;
  const pages = site.draft.pages || [];
  for (const page of pages) {
    if (!page.title.trim())
      return {
        field: "page-title",
        message: "عنوان صفحه را وارد کن.",
        pageId: page.id,
        tab: "pages",
      };
    if (
      !isValidPageSlug(page.slug) ||
      pages.some((other) => other.id !== page.id && other.slug === page.slug)
    )
      return {
        field: "page-slug",
        message:
          "آدرس صفحه نامعتبر یا تکراری است؛ از حروف انگلیسی، عدد و خط تیره استفاده کن.",
        pageId: page.id,
        tab: "pages",
      };
  }
  for (const placement of ["header", "footer"] as const) {
    for (const item of site.draft.navigation?.[placement] || []) {
      if (!item.label.trim())
        return {
          field: `menu-${placement}-${item.id}-label`,
          message: "متن لینک منو را وارد کن.",
          tab: "pages",
          menuPlacement: placement,
        };
      if (
        item.target.type === "url" &&
        (!linkPattern.test(item.target.url) || item.target.url === "https://")
      )
        return {
          field: `menu-${placement}-${item.id}-url`,
          message: "نشانی لینک منو معتبر نیست.",
          tab: "pages",
          menuPlacement: placement,
        };
    }
  }
  for (const { section, pageId } of [
    ...site.draft.sections.map((section) => ({ section, pageId: "" })),
    ...pages.flatMap((page) =>
      page.sections.map((section) => ({ section, pageId: page.id })),
    ),
  ]) {
    const context = `بخش «${section.title || sectionLabels[section.type]}»`;
    const fields = [
      { field: `${section.id}-image`, value: section.image, image: true },
      {
        field: `${section.id}-buttonUrl`,
        value: section.buttonUrl,
        image: false,
      },
      ...(section.items || []).flatMap((item) => [
        {
          field: `${item.id}-image`,
          value: item.image,
          image: true,
          itemId: item.id,
        },
        {
          field: `${item.id}-url`,
          value: item.url,
          image: false,
          itemId: item.id,
        },
      ]),
    ];
    for (const field of fields) {
      if (
        !field.value?.trim() ||
        (field.image ? imagePattern : linkPattern).test(field.value)
      )
        continue;
      return {
        field: field.field,
        pageId,
        sectionId: section.id,
        itemId: "itemId" in field ? field.itemId : undefined,
        message: field.image
          ? `نشانی تصویر ${context} باید با https:// یا http:// شروع شود.`
          : `پیوند ${context} معتبر نیست. از نشانی وب، #بخش، /مسیر، tel: یا mailto: استفاده کن.`,
      };
    }
  }
  return null;
}
export function Editor({ id }: { id: string }) {
  const demo = id === "demo";
  const [site, setSite] = useState<Site>(createDemoSite());
  const [active, setActive] = useState("hero");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [linkedPage, setLinkedPage] = useState<{
    sectionId: string;
    item: SectionItem;
  } | null>(null);
  const selectedPage = site.draft.pages?.find(
    (page) => page.id === selectedPageId,
  );
  const sections = selectedPage?.sections || site.draft.sections;
  const [tab, setTab] = useState("content");
  const [device, setDevice] = useState("desktop");
  const [operation, setOperation] = useState<
    "save" | "publish" | "template" | null
  >(null);
  const busy = operation !== null;
  const requestInFlight = useRef(false);
  const [loaded, setLoaded] = useState(demo);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const dirty =
    loaded &&
    savedSnapshot !== null &&
    editableSnapshot(site) !== savedSnapshot;
  const [issue, setIssue] = useState<EditorIssue | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [add, setAdd] = useState(false);
  const [confirmation, setConfirmation] = useState<
    | { kind: "section"; id: string; title: string }
    | { kind: "item"; id: string; sectionId: string; title: string }
    | { kind: "template"; id: TemplateId; title: string }
    | { kind: "leave"; href: string }
    | { kind: "publish" }
    | null
  >(null);
  const [resources, setResources] = useState<{
    forms: SiteForm[];
    posts: Post[];
    loading: boolean;
    error: string;
  }>({ forms: [], posts: [], loading: false, error: "" });
  const [resourcesRefresh, setResourcesRefresh] = useState(0);
  const [scale, setScale] = useState(0.7);
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const allowNavigation = useRef(false);
  useEffect(() => {
    let cancelled = false;
    setError("");
    setSavedSnapshot(null);
    setIssue(null);
    setMessage("");
    setConfirmation(null);
    setAdd(false);
    setSelectedPageId("");
    setLinkedPage(null);
    allowNavigation.current = false;
    if (demo) {
      const initial = createDemoSite();
      setSite(initial);
      setSavedSnapshot(editableSnapshot(initial));
      setActive(initial.draft.sections[0]?.id || "hero");
      try {
        const saved = localStorage.getItem("araland-demo-draft");
        if (saved) {
          const restored = JSON.parse(saved) as Site;
          if (
            restored.draft?.brand &&
            Array.isArray(restored.draft.sections) &&
            templates.some((template) => template.id === restored.templateId)
          ) {
            setSite(restored);
            setSavedSnapshot(editableSnapshot(restored));
            setActive(restored.draft.sections[0]?.id || "hero");
          }
        }
      } catch {}
      setLoaded(true);
      return;
    }
    setLoaded(false);
    if (!getToken()) {
      location.href = `/login?returnTo=/editor/${id}`;
      return;
    }
    request<{ site: Site }>(`/sites/${id}`)
      .then((d) => {
        if (cancelled) return;
        setSite(d.site);
        setSavedSnapshot(editableSnapshot(d.site));
        setActive(d.site.draft.sections[0]?.id || "hero");
        setLoaded(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, demo]);
  useEffect(() => {
    if (demo || !loaded) return;
    let current = true;
    setResources((previous) => ({ ...previous, loading: true, error: "" }));
    Promise.all([
      request<{ forms: SiteForm[] }>(`/sites/${id}/forms`),
      request<{ posts: Post[] }>(`/sites/${id}/posts`),
    ])
      .then(([forms, posts]) => {
        if (current)
          setResources({
            forms: forms.forms,
            posts: posts.posts.filter((post) => post.published),
            loading: false,
            error: "",
          });
      })
      .catch(() => {
        if (current)
          setResources((previous) => ({
            ...previous,
            loading: false,
            error: "فرم‌ها و نوشته‌های پیش‌نمایش به‌روز نشدند. دوباره تلاش کن.",
          }));
      });
    return () => {
      current = false;
    };
  }, [id, demo, loaded, resourcesRefresh]);
  useEffect(() => {
    const refresh = () => setResourcesRefresh((value) => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver((entries) =>
      setScale(
        Math.min(
          1,
          Math.max(
            0.1,
            (entries[0].contentRect.width - 48) /
              (device === "mobile" ? 390 : 1200),
          ),
        ),
      ),
    );
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [device, loaded]);
  const sendPreview = () =>
    frame.current?.contentWindow?.postMessage(
      {
        type: "araland-preview",
        selectedPageId,
        site,
        forms: resources.forms,
        posts: resources.posts,
      },
      location.origin,
    );
  useEffect(sendPreview, [site, resources, selectedPageId]);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "araland-preview-ready"
      )
        sendPreview();
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [site, resources, selectedPageId]);
  useEffect(() => {
    const navigatePreview = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "araland-preview-page"
      )
        return;
      const pageId = event.data.pageId;
      if (
        typeof pageId === "string" &&
        (pageId === "" || site.draft.pages?.some((page) => page.id === pageId))
      )
        selectPage(pageId);
    };
    window.addEventListener("message", navigatePreview);
    return () => window.removeEventListener("message", navigatePreview);
  }, [site.draft.pages]);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if ((dirty || busy) && !allowNavigation.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty, busy]);
  useEffect(() => {
    if (!focusTarget) return;
    const scheduled = requestAnimationFrame(() => {
      const target = document.getElementById(focusTarget);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", behavior: "instant" });
      setFocusTarget(null);
    });
    return () => cancelAnimationFrame(scheduled);
  }, [focusTarget, active, tab]);
  function mutate(fn: (s: Site) => Site) {
    if (requestInFlight.current || !loaded) return;
    setSite((s) => fn(s));
    setMessage("");
    setError("");
    setIssue(null);
  }
  function selectPage(pageId: string) {
    setSelectedPageId(pageId);
    setActive(
      (pageId
        ? site.draft.pages?.find((page) => page.id === pageId)?.sections
        : site.draft.sections)?.[0]?.id || "",
    );
    setExpandedItems(new Set());
    setIssue(null);
  }
  useEffect(() => {
    if (selectedPageId && !selectedPage) return;
    if (!sections.some((section) => section.id === active))
      setActive(sections[0]?.id || "");
  }, [selectedPageId, sections, active, selectedPage]);
  function withSections(
    content: SiteContent,
    transform: (sections: Section[]) => Section[],
  ): SiteContent {
    if (selectedPageId)
      return {
        ...content,
        pages: content.pages?.map((page) =>
          page.id === selectedPageId
            ? { ...page, sections: transform(page.sections) }
            : page,
        ),
      };
    const next = transform(content.sections);
    return {
      ...content,
      sections: next,
      ...(content.navigation
        ? {
            navigation: {
              header: content.navigation.header.filter(
                (item) =>
                  item.target.type !== "section" ||
                  next.some(
                    (section) =>
                      section.id ===
                      (item.target as { sectionId: string }).sectionId,
                  ),
              ),
              footer: content.navigation.footer.filter(
                (item) =>
                  item.target.type !== "section" ||
                  next.some(
                    (section) =>
                      section.id ===
                      (item.target as { sectionId: string }).sectionId,
                  ),
              ),
            },
          }
        : {}),
    };
  }
  function updateSections(transform: (sections: Section[]) => Section[]) {
    mutate((current) => ({
      ...current,
      draft: withSections(current.draft, transform),
    }));
  }
  const selected = sections.find((s) => s.id === active);
  useEffect(() => {
    setExpandedItems(
      new Set(
        issue?.sectionId === active && issue.itemId
          ? [issue.itemId]
          : selected?.items?.[0]
            ? [selected.items[0].id]
            : [],
      ),
    );
  }, [active, selectedPageId]);
  function validateDraft() {
    const nextIssue = draftIssue(site);
    setIssue(nextIssue);
    if (!nextIssue) return true;
    setError(nextIssue.message);
    setTab(nextIssue.tab || (nextIssue.sectionId ? "content" : "brand"));
    if (nextIssue.pageId !== undefined) selectPage(nextIssue.pageId);
    setIssue(nextIssue);
    if (nextIssue.sectionId) setActive(nextIssue.sectionId);
    if (nextIssue.itemId) setExpandedItems(new Set([nextIssue.itemId]));
    setFocusTarget(nextIssue.field);
    return false;
  }
  function updateSection(patch: Partial<Section>) {
    updateSections((items) =>
      items.map((section) =>
        section.id === active ? { ...section, ...patch } : section,
      ),
    );
  }
  function moveSection(index: number, delta: number) {
    if (index + delta < 0 || index + delta >= sections.length) return;
    updateSections((items) => {
      const next = [...items];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
    setMessage(
      `بخش به جایگاه ${(index + delta + 1).toLocaleString("fa-IR")} منتقل شد؛ برای نگهداری تغییر، ذخیره کن.`,
    );
  }
  async function save(publish = false) {
    if (requestInFlight.current || !loaded || !validateDraft()) return false;
    requestInFlight.current = true;
    setOperation(publish ? "publish" : "save");
    setError("");
    setMessage("");
    let draftSaved = false;
    try {
      if (demo) {
        localStorage.setItem("araland-demo-draft", JSON.stringify(site));
        setSavedSnapshot(editableSnapshot(site));
        setMessage(
          "پیش‌نویس نمونه در همین مرورگر ذخیره شد. برای انتشار، وارد حساب شو.",
        );
        if (publish) {
          allowNavigation.current = true;
          location.href = "/login";
        }
        return true;
      }
      const data = await request<{ site: Site }>(
        `/sites/${id}`,
        json(
          {
            draft: normalizeContent(site.draft),
            name: site.name,
            seo: site.seo,
          },
          "PATCH",
        ),
      );
      let result = data.site;
      draftSaved = true;
      setSite(result);
      setSavedSnapshot(editableSnapshot(result));
      if (publish) {
        result = (
          await request<{ site: Site }>(`/sites/${id}/publish`, json({}))
        ).site;
      }
      setSite(result);
      setSavedSnapshot(editableSnapshot(result));
      if (publish) setConfirmation(null);
      setMessage(
        publish
          ? "سایت شما منتشر شد و برای مخاطبان قابل مشاهده است."
          : "پیش‌نویس ذخیره شد. برای نمایش این تغییرات به مخاطبان، انتشار را بزن.",
      );
      return true;
    } catch (e) {
      setError(
        `${publish && draftSaved ? "پیش‌نویس ذخیره شد، اما انتشار انجام نشد. دوباره تلاش کن. " : ""}${(e as Error).message}`,
      );
      return false;
    } finally {
      requestInFlight.current = false;
      setOperation(null);
    }
  }
  async function confirmChange() {
    if (!confirmation || requestInFlight.current || !loaded) return;
    if (confirmation.kind === "publish") {
      await save(true);
      return;
    }
    if (confirmation.kind === "leave") {
      allowNavigation.current = true;
      location.href = confirmation.href;
      return;
    }
    if (confirmation.kind === "item") {
      updateSections((items) =>
        items.map((section) =>
          section.id === confirmation.sectionId
            ? {
                ...section,
                items: section.items?.filter(
                  (item) => item.id !== confirmation.id,
                ),
              }
            : section,
        ),
      );
      setConfirmation(null);
      setMessage("آیتم از پیش‌نویس حذف شد. برای نگه‌داشتن تغییر، ذخیره کن.");
      return;
    }
    if (confirmation.kind === "section") {
      if (sections.length <= 1) return;
      const remaining = sections.filter(
        (section) => section.id !== confirmation.id,
      );
      updateSections(() => remaining);
      setActive(remaining[0]?.id || "");
      setConfirmation(null);
      return;
    }
    const templateId = confirmation.id;
    if (!validateDraft()) {
      setConfirmation(null);
      return;
    }
    if (demo) {
      const draft = {
        ...createContent(templateId),
        pages: site.draft.pages,
        navigation: site.draft.navigation,
      };
      mutate((current) => ({ ...current, templateId, draft }));
      setSelectedPageId("");
      setActive(draft.sections[0]?.id || "");
      setConfirmation(null);
      return;
    }
    requestInFlight.current = true;
    setOperation("template");
    setError("");
    setMessage("");
    try {
      if (dirty)
        await request(
          `/sites/${id}`,
          json(
            {
              draft: normalizeContent(site.draft),
              name: site.name,
              seo: site.seo,
            },
            "PATCH",
          ),
        );
      const data = await request<{ site: Site }>(
        `/sites/${id}/template`,
        json({ templateId }),
      );
      setSite(data.site);
      setSelectedPageId("");
      setActive(data.site.draft.sections[0]?.id || "");
      setSavedSnapshot(editableSnapshot(data.site));
      setConfirmation(null);
      setMessage(
        "قالب پیش‌نویس تغییر کرد. برای نمایش در سایت، دوباره منتشر کن.",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      requestInFlight.current = false;
      setOperation(null);
    }
  }
  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-header-right">
          <Link
            href="/"
            className="icon-btn"
            aria-label="بازگشت به داشبورد"
            onNavigate={(event) => {
              if (dirty || busy) {
                event.preventDefault();
                if (!busy) setConfirmation({ kind: "leave", href: "/" });
              }
            }}
          >
            <ArrowRight size={21} />
          </Link>
          <div className="editor-title">
            <b>{loaded ? site.name : "دریافت سایت…"}</b>
            <span role="status" aria-live="polite" aria-atomic="true">
              <i className={dirty ? "unsaved" : ""} aria-hidden="true" />
              {!loaded
                ? error
                  ? "دریافت سایت انجام نشد"
                  : "در حال دریافت اطلاعات"
                : busy
                  ? operation === "publish"
                    ? "در حال ذخیره و انتشار…"
                    : operation === "template"
                      ? "در حال تغییر قالب…"
                      : "در حال ذخیره پیش‌نویس…"
                  : dirty
                    ? "تغییرات ذخیره نشده"
                    : demo
                      ? "فضای آزمایشی ویرایشگر"
                      : site.publishedAt
                        ? "پیش‌نویس ذخیره است"
                        : "ذخیره‌شده؛ هنوز منتشر نشده"}
            </span>
          </div>
        </div>
        <div className="device-switch">
          <ActionButton
            aria-label="نمای دسکتاپ"
            aria-pressed={device === "desktop"}
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
          >
            <Monitor size={18} />
          </ActionButton>
          <ActionButton
            aria-label="نمای موبایل"
            aria-pressed={device === "mobile"}
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone size={18} />
          </ActionButton>
        </div>
        <div className="editor-header-actions">
          {loaded && site.publishedAt && !demo && (
            <Link
              href={`/s/${site.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              aria-label="سایت منتشرشده"
            >
              <ExternalLink size={18} />
            </Link>
          )}
          <Button
            className="btn-outline btn-small"
            type="button"
            loading={operation === "save"}
            disabled={!loaded || busy || !dirty}
            onClick={() => save()}
          >
            <Save size={15} />
            ذخیره
          </Button>
          <Button
            className="btn-small"
            type="button"
            loading={operation === "publish"}
            disabled={!loaded || busy}
            onClick={() => {
              setError("");
              if (validateDraft()) setConfirmation({ kind: "publish" });
            }}
          >
            <Upload size={15} />
            {demo
              ? "ورود و انتشار"
              : site.publishedAt
                ? "انتشار تغییرات"
                : "انتشار سایت"}
          </Button>
        </div>
      </header>
      <div className="editor-body">
        <aside className="editor-sidebar">
          <Tabs
            className="editor-navigation"
            selectedKey={tab}
            onSelectionChange={(key) => setTab(String(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List className="editor-tabs" aria-label="بخش‌های ویرایشگر">
                <Tabs.Tab id="content">
                  <LayoutTemplate size={16} />
                  بخش‌ها
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="pages">
                  صفحه‌ها و منوها
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="brand">
                  <Palette size={16} />
                  هویت بصری
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <div className="editor-sidebar-scroll">
              <Notice message={error} error />
              <Notice message={message} />
              {!loaded &&
                (!error ? (
                  <div className="panel-loading" role="status">
                    <Spinner size="sm" aria-hidden="true" />
                    در حال دریافت اطلاعات…
                  </div>
                ) : (
                  <Button
                    className="btn-outline"
                    onClick={() => location.reload()}
                  >
                    تلاش دوباره
                  </Button>
                ))}
              {demo && (
                <div className="editor-demo-note">
                  اینجا آزادانه امتحان کن؛ برای انتشار سایت وارد حسابت شو.
                </div>
              )}
              {loaded && (
                <div className="editor-hint">
                  <b>
                    {demo
                      ? "پیش‌نمایش نمونه"
                      : site.publishedAt
                        ? "پیش‌نویس و سایت منتشرشده"
                        : "آماده‌سازی اولین انتشار"}
                  </b>
                  <p>
                    {demo
                      ? "ذخیره فقط در همین مرورگر انجام می‌شود. محتوای نمونه خودکار به سایت حساب شما منتقل نمی‌شود."
                      : site.publishedAt
                        ? "ذخیره، پیش‌نویس را نگه می‌دارد. مخاطبان نسخه آخرین انتشار را می‌بینند."
                        : "نام برند، متن‌ها و تصاویر را شخصی کن؛ پیش‌نمایش را ببین و پس از آماده شدن، انتشار سایت را بزن."}
                  </p>
                  {site.publishedAt && !demo && (
                    <>
                      <p>
                        آخرین انتشار:{" "}
                        {new Date(site.publishedAt).toLocaleString("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <Link
                        className="text-btn"
                        href={`/s/${site.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        دیدن سایت منتشرشده{" "}
                        <ExternalLink size={13} aria-hidden="true" />
                      </Link>
                    </>
                  )}
                  {!demo && (
                    <>
                      <Notice message={resources.error} error />
                      <ActionButton
                        className="text-btn"
                        disabled={resources.loading}
                        onClick={() =>
                          setResourcesRefresh((value) => value + 1)
                        }
                      >
                        {resources.loading
                          ? "دریافت فرم‌ها و نوشته‌ها…"
                          : "به‌روزرسانی فرم‌ها و نوشته‌ها"}
                      </ActionButton>
                    </>
                  )}
                  <div
                    className="dialog-actions"
                    role="group"
                    aria-label="اندازه پیش‌نمایش"
                  >
                    <ActionButton
                      className="text-btn"
                      aria-pressed={device === "desktop"}
                      onClick={() => setDevice("desktop")}
                    >
                      <Monitor size={14} aria-hidden="true" /> دسکتاپ
                    </ActionButton>
                    <ActionButton
                      className="text-btn"
                      aria-pressed={device === "mobile"}
                      onClick={() => setDevice("mobile")}
                    >
                      <Smartphone size={14} aria-hidden="true" /> موبایل
                    </ActionButton>
                    <ActionButton
                      className="text-btn"
                      onClick={() => {
                        frame.current?.focus();
                        canvas.current?.scrollIntoView({
                          block: "start",
                          behavior: "instant",
                        });
                      }}
                    >
                      <Eye size={14} aria-hidden="true" /> دیدن پیش‌نمایش
                    </ActionButton>
                  </div>
                </div>
              )}
              {loaded && (
                <div className="editor-page-picker">
                  <SelectField
                    label="صفحهٔ در حال ویرایش"
                    value={selectedPageId || "home"}
                    disabled={busy}
                    onChange={(value) =>
                      selectPage(value === "home" ? "" : value)
                    }
                    options={[
                      { value: "home", label: "صفحهٔ اصلی" },
                      ...(site.draft.pages || []).map((page) => ({
                        value: page.id,
                        label: `${page.title}${page.enabled ? "" : " (غیرفعال)"}`,
                      })),
                    ]}
                  />
                  {selectedPage && (
                    <p className="editor-hint" dir="ltr">
                      /{selectedPage.slug}
                    </p>
                  )}
                </div>
              )}
              <Tabs.Panel id="pages">
                {loaded && (
                  <PageManager
                    content={site.draft}
                    selectedPageId={selectedPageId}
                    onChange={(draft) =>
                      mutate((current) => ({ ...current, draft }))
                    }
                    onSelect={selectPage}
                    onEdit={() => setTab("content")}
                    disabled={busy}
                    hasPosts={resources.posts.length > 0}
                    menuIssue={
                      issue?.menuPlacement
                        ? { placement: issue.menuPlacement, field: issue.field }
                        : undefined
                    }
                  />
                )}
              </Tabs.Panel>
              <Tabs.Panel id="content">
                {loaded && (
                  <>
                    <div className="section-list-title">
                      <b>ساختار صفحه</b>
                      <ActionButton
                        className="text-btn"
                        disabled={busy || sections.length >= 40}
                        onClick={() => setAdd(true)}
                      >
                        <Plus size={14} />
                        افزودن
                      </ActionButton>
                    </div>
                    <div className="section-list">
                      {sections.map((section, i) => (
                        <div
                          key={section.id}
                          className={`section-row ${section.id === active ? "selected" : ""} ${!section.enabled ? "hidden-section" : ""}`}
                        >
                          <ActionButton
                            className="section-select"
                            aria-pressed={section.id === active}
                            aria-label={`ویرایش ${sectionLabels[section.type]}: ${section.title || "بدون عنوان"}${section.enabled ? "" : "، پنهان"}`}
                            aria-controls="section-inspector"
                            onClick={() => {
                              setActive(section.id);
                              setFocusTarget(`${section.id}-title`);
                            }}
                          >
                            <LayoutTemplate size={14} aria-hidden="true" />
                            <span>{sectionLabels[section.type]}</span>
                          </ActionButton>
                          <div className="section-row-actions">
                            <ActionButton
                              aria-label={`بالا بردن ${section.title || sectionLabels[section.type]}`}
                              disabled={busy || i === 0}
                              onClick={() => moveSection(i, -1)}
                            >
                              <ArrowUp size={12} />
                            </ActionButton>
                            <ActionButton
                              aria-label={`پایین بردن ${section.title || sectionLabels[section.type]}`}
                              disabled={busy || i === sections.length - 1}
                              onClick={() => moveSection(i, 1)}
                            >
                              <ArrowDown size={12} />
                            </ActionButton>
                            <ActionButton
                              aria-label={`${section.enabled ? "پنهان کردن" : "نمایش"} ${section.title || sectionLabels[section.type]}`}
                              disabled={busy}
                              aria-pressed={!section.enabled}
                              onClick={() =>
                                updateSections((items) =>
                                  items.map((x) =>
                                    x.id === section.id
                                      ? { ...x, enabled: !x.enabled }
                                      : x,
                                  ),
                                )
                              }
                            >
                              {section.enabled ? (
                                <Eye size={14} />
                              ) : (
                                <EyeOff size={14} />
                              )}
                            </ActionButton>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="editor-hint">
                      روی نام بخش بزن تا ویرایشش کنی. فلش‌ها ترتیب را عوض
                      می‌کنند و آیکن چشم، نمایش بخش را روشن یا خاموش می‌کند.
                    </p>
                    {selected && (
                      <div className="section-inspector" id="section-inspector">
                        <div className="inspector-heading">
                          <Settings2 size={15} />
                          <h3>ویرایش {sectionLabels[selected.type]}</h3>
                          <ActionButton
                            className="icon-btn danger"
                            aria-label="حذف بخش"
                            disabled={busy || sections.length <= 1}
                            onClick={() => {
                              setConfirmation({
                                kind: "section",
                                id: selected.id,
                                title: sectionLabels[selected.type],
                              });
                            }}
                          >
                            <Trash2 size={15} />
                          </ActionButton>
                        </div>
                        {!selected.enabled && (
                          <div className="editor-hint">
                            این بخش پنهان است و در پیش‌نمایش نمایش داده نمی‌شود.
                            <ActionButton
                              className="text-btn"
                              disabled={busy}
                              onClick={() => updateSection({ enabled: true })}
                            >
                              <Eye size={14} aria-hidden="true" /> نمایش این بخش
                            </ActionButton>
                          </div>
                        )}
                        <label>
                          عنوان بخش
                          <TextArea
                            id={`${selected.id}-title`}
                            rows={2}
                            value={selected.title}
                            onChange={(e) =>
                              updateSection({ title: e.target.value })
                            }
                            disabled={busy}
                            maxLength={500}
                          />
                        </label>
                        <label>
                          توضیحات
                          <TextArea
                            rows={3}
                            value={selected.subtitle || ""}
                            onChange={(e) =>
                              updateSection({ subtitle: e.target.value })
                            }
                            disabled={busy}
                            maxLength={5000}
                          />
                        </label>
                        {["hero", "about"].includes(selected.type) && (
                          <label>
                            تصویر بخش
                            <Input
                              id={`${selected.id}-image`}
                              aria-label="تصویر بخش"
                              aria-describedby={`${selected.id}-image-help`}
                              dir="ltr"
                              type="url"
                              value={selected.image || ""}
                              onChange={(e) =>
                                updateSection({ image: e.target.value })
                              }
                              placeholder="https://…"
                              disabled={busy}
                              aria-invalid={
                                issue?.field === `${selected.id}-image` ||
                                undefined
                              }
                              maxLength={2048}
                            />
                            {selected.image && (
                              <img
                                className="inspector-image"
                                src={selected.image}
                                alt="تصویر فعلی بخش"
                              />
                            )}
                            <small id={`${selected.id}-image-help`}>
                              تصویر را در استودیو رسانه بارگذاری کن و نشانی‌اش
                              را اینجا قرار بده.
                            </small>
                            <Link
                              className="text-btn"
                              href={`/?view=media&site=${id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              باز کردن کتابخانه تصاویر{" "}
                              <ExternalLink size={13} />
                            </Link>
                          </label>
                        )}
                        {["hero", "contact", "about"].includes(
                          selected.type,
                        ) && (
                          <>
                            <label>
                              متن دکمه
                              <Input
                                value={selected.buttonText || ""}
                                onChange={(e) =>
                                  updateSection({ buttonText: e.target.value })
                                }
                                disabled={busy}
                                maxLength={100}
                              />
                            </label>
                            {selected.type !== "contact" && (
                              <InternalPageLink
                                pages={site.draft.pages || []}
                                pageId={selected.buttonPageId}
                                disabled={busy}
                                label="صفحهٔ مقصد دکمه"
                                onChange={(buttonPageId) =>
                                  updateSection({
                                    buttonPageId,
                                    buttonUrl: undefined,
                                  })
                                }
                              />
                            )}
                            {selected.type !== "contact" &&
                              !selected.buttonPageId && (
                                <label>
                                  پیوند دکمه
                                  <Input
                                    id={`${selected.id}-buttonUrl`}
                                    dir="ltr"
                                    value={selected.buttonUrl || ""}
                                    onChange={(e) =>
                                      updateSection({
                                        buttonUrl: e.target.value,
                                        buttonPageId: undefined,
                                      })
                                    }
                                    placeholder="#contact"
                                    disabled={busy}
                                    aria-invalid={
                                      issue?.field ===
                                        `${selected.id}-buttonUrl` || undefined
                                    }
                                    maxLength={2048}
                                  />
                                </label>
                              )}
                            {selected.type !== "contact" && (
                              <p className="editor-hint">
                                برای تماس مستقیم، پیوندی مثل{" "}
                                <bdi dir="ltr">tel:09121234567</bdi> وارد کن؛
                                برای رفتن به فرم از{" "}
                                <bdi dir="ltr">#contact</bdi> استفاده کن.
                              </p>
                            )}
                          </>
                        )}
                        {!["hero", "about", "contact", "blog"].includes(
                          selected.type,
                        ) && (
                          <div className="items-inspector">
                            <div className="section-list-title">
                              <b>آیتم‌های بخش</b>
                              <ActionButton
                                className="text-btn"
                                disabled={
                                  busy || (selected.items?.length || 0) >= 40
                                }
                                onClick={() => {
                                  const itemId = `item_${crypto.randomUUID()}`;
                                  updateSection({
                                    items: [
                                      ...(selected.items || []),
                                      {
                                        id: itemId,
                                        title: "عنوان تازه",
                                        description: "",
                                      },
                                    ],
                                  });
                                  setExpandedItems(
                                    (items) => new Set([...items, itemId]),
                                  );
                                  setFocusTarget(`${itemId}-title`);
                                }}
                              >
                                <Plus size={14} />
                                افزودن
                              </ActionButton>
                            </div>
                            <Accordion
                              className="editor-items-accordion"
                              key={selected.id}
                              allowsMultipleExpanded
                              expandedKeys={expandedItems}
                              onExpandedChange={(keys) =>
                                setExpandedItems(
                                  new Set(Array.from(keys, String)),
                                )
                              }
                            >
                              {selected.items?.map((item) => (
                                <Accordion.Item
                                  className="item-config"
                                  key={item.id}
                                  id={item.id}
                                >
                                  <Accordion.Heading>
                                    <Accordion.Trigger>
                                      {item.title || "آیتم بدون عنوان"}
                                      <Accordion.Indicator>
                                        <ChevronDown size={14} />
                                      </Accordion.Indicator>
                                    </Accordion.Trigger>
                                  </Accordion.Heading>
                                  <Accordion.Panel>
                                    <Accordion.Body>
                                      <label>
                                        عنوان
                                        <Input
                                          id={`${item.id}-title`}
                                          value={item.title}
                                          onChange={(e) =>
                                            updateSection({
                                              items: selected.items!.map((x) =>
                                                x.id === item.id
                                                  ? {
                                                      ...x,
                                                      title: e.target.value,
                                                    }
                                                  : x,
                                              ),
                                            })
                                          }
                                          disabled={busy}
                                          maxLength={500}
                                        />
                                      </label>
                                      <label>
                                        توضیحات
                                        <TextArea
                                          rows={3}
                                          value={item.description || ""}
                                          onChange={(e) =>
                                            updateSection({
                                              items: selected.items!.map((x) =>
                                                x.id === item.id
                                                  ? {
                                                      ...x,
                                                      description:
                                                        e.target.value,
                                                    }
                                                  : x,
                                              ),
                                            })
                                          }
                                          disabled={busy}
                                          maxLength={5000}
                                        />
                                      </label>
                                      {!["faq", "testimonials"].includes(
                                        selected.type,
                                      ) && (
                                        <>
                                          <label>
                                            نشانی تصویر
                                            <Input
                                              id={`${item.id}-image`}
                                              dir="ltr"
                                              type="url"
                                              value={item.image || ""}
                                              onChange={(e) =>
                                                updateSection({
                                                  items: selected.items!.map(
                                                    (x) =>
                                                      x.id === item.id
                                                        ? {
                                                            ...x,
                                                            image:
                                                              e.target.value,
                                                          }
                                                        : x,
                                                  ),
                                                })
                                              }
                                              disabled={busy}
                                              aria-invalid={
                                                issue?.field ===
                                                  `${item.id}-image` ||
                                                undefined
                                              }
                                              maxLength={2048}
                                            />
                                          </label>
                                          <InternalPageLink
                                            pages={site.draft.pages || []}
                                            pageId={item.pageId}
                                            disabled={busy}
                                            onChange={(pageId) =>
                                              updateSection({
                                                items: selected.items!.map(
                                                  (x) =>
                                                    x.id === item.id
                                                      ? {
                                                          ...x,
                                                          pageId,
                                                          url: undefined,
                                                        }
                                                      : x,
                                                ),
                                              })
                                            }
                                          />
                                          {selected.type === "services" &&
                                            !item.pageId && (
                                              <ActionButton
                                                className="text-btn"
                                                disabled={
                                                  busy ||
                                                  (site.draft.pages?.length ||
                                                    0) >= 50
                                                }
                                                onClick={() =>
                                                  setLinkedPage({
                                                    sectionId: selected.id,
                                                    item,
                                                  })
                                                }
                                              >
                                                <Plus size={14} />
                                                ساخت صفحه برای این خدمت یا موضوع
                                              </ActionButton>
                                            )}
                                          {!item.pageId && (
                                            <label>
                                              پیوند
                                              <Input
                                                id={`${item.id}-url`}
                                                dir="ltr"
                                                value={item.url || ""}
                                                onChange={(e) =>
                                                  updateSection({
                                                    items: selected.items!.map(
                                                      (x) =>
                                                        x.id === item.id
                                                          ? {
                                                              ...x,
                                                              url: e.target
                                                                .value,
                                                              pageId: undefined,
                                                            }
                                                          : x,
                                                    ),
                                                  })
                                                }
                                                disabled={busy}
                                                aria-invalid={
                                                  issue?.field ===
                                                    `${item.id}-url` ||
                                                  undefined
                                                }
                                                maxLength={2048}
                                              />
                                            </label>
                                          )}
                                        </>
                                      )}
                                      <ActionButton
                                        className="text-btn danger"
                                        disabled={busy}
                                        onClick={() =>
                                          setConfirmation({
                                            kind: "item",
                                            id: item.id,
                                            sectionId: selected.id,
                                            title: item.title || "بدون عنوان",
                                          })
                                        }
                                      >
                                        <Trash2 size={13} />
                                        حذف آیتم
                                      </ActionButton>
                                    </Accordion.Body>
                                  </Accordion.Panel>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          </div>
                        )}
                        {selected.type === "blog" && (
                          <p className="editor-hint">
                            نوشته‌ها را از بخش بلاگ داشبورد اضافه کن. نوشته‌های
                            منتشرشده در این پیش‌نمایش و سایت دیده می‌شوند. پس از
                            ویرایش، پیش‌نمایش را به‌روزرسانی کن.
                            <Link
                              className="text-btn"
                              href={`/?view=posts&site=${id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              مدیریت نوشته‌ها <ExternalLink size={13} />
                            </Link>
                          </p>
                        )}
                        {selected.type === "contact" && (
                          <p className="editor-hint">
                            فیلدهای فرم از بخش «فرم‌ها» در داشبورد مدیریت
                            می‌شوند. اینجا فیلدهای واقعی فرم دیده می‌شوند؛ ثبت
                            پاسخ در پیش‌نمایش انجام نمی‌شود.
                            <Link
                              className="text-btn"
                              href={`/?view=forms&site=${id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              مدیریت فرم‌ها <ExternalLink size={13} />
                            </Link>
                          </p>
                        )}
                        {selected.type === "instagram" && (
                          <p className="editor-hint">
                            این بخش گالری انتخابی است. تصویر و پیوند هر پست را
                            اضافه کن؛ اتصال خودکار حساب نیست.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Tabs.Panel>
              <Tabs.Panel id="brand">
                {loaded && (
                  <div className="brand-inspector">
                    <h3>سایتی شبیه برند تو</h3>
                    <label>
                      نام برند
                      <Input
                        id="editor-brand-name"
                        aria-invalid={
                          issue?.field === "editor-brand-name" || undefined
                        }
                        required
                        value={site.draft.brand.name}
                        onChange={(e) =>
                          mutate((s) => ({
                            ...s,
                            draft: {
                              ...s.draft,
                              brand: { ...s.draft.brand, name: e.target.value },
                            },
                          }))
                        }
                        disabled={busy}
                        maxLength={160}
                      />
                    </label>
                    <label>
                      شعار برند
                      <Input
                        value={site.draft.brand.tagline}
                        onChange={(e) =>
                          mutate((s) => ({
                            ...s,
                            draft: {
                              ...s.draft,
                              brand: {
                                ...s.draft.brand,
                                tagline: e.target.value,
                              },
                            },
                          }))
                        }
                        disabled={busy}
                        maxLength={500}
                      />
                    </label>
                    <label>
                      رنگ اصلی
                      <Input
                        type="color"
                        value={site.draft.brand.primaryColor}
                        onChange={(e) =>
                          mutate((s) => ({
                            ...s,
                            draft: {
                              ...s.draft,
                              brand: {
                                ...s.draft.brand,
                                primaryColor: e.target.value,
                              },
                            },
                          }))
                        }
                        disabled={busy}
                      />
                    </label>
                    <h3>قالب صفحه</h3>
                    {templates.map((t) => (
                      <ActionButton
                        key={t.id}
                        className={`editor-template-option ${site.templateId === t.id ? "selected" : ""}`}
                        disabled={busy}
                        aria-pressed={site.templateId === t.id}
                        onClick={() => {
                          if (site.templateId === t.id) return;
                          setError("");
                          setConfirmation({
                            kind: "template",
                            id: t.id,
                            title: t.name,
                          });
                        }}
                      >
                        <span style={{ background: t.color }} />
                        <div>
                          <b>{t.name}</b>
                          <small>{t.category}</small>
                        </div>
                        {site.templateId === t.id && <Check size={16} />}
                      </ActionButton>
                    ))}
                    <p className="editor-hint">
                      انتخاب قالب، محتوای پیش‌نویس را جایگزین می‌کند. سایت فعال
                      تا انتشار دوباره تغییر نمی‌کند.
                    </p>
                  </div>
                )}
              </Tabs.Panel>
            </div>
          </Tabs>
          <div className="editor-sidebar-footer">
            <span className="small-check">
              <Check size={11} />
            </span>
            پیش‌نویس و سایت زنده، مستقل از هم
          </div>
        </aside>
        <div className="editor-canvas" ref={canvas}>
          <div className="canvas-toolbar">
            <span>
              <span className="canvas-dot" />
              پیش‌نمایش پیش‌نویس
            </span>
            <span dir="ltr">
              {demo ? "پیش‌نمایش آزمایشی" : loaded ? `/s/${site.slug}` : "…"}
            </span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          {loaded && (
            <div
              className={`preview-frame-wrap ${device === "mobile" ? "phone-frame" : ""}`}
              style={{
                width: (device === "mobile" ? 390 : 1200) * scale,
                height: Math.max(620, 900 * scale),
              }}
            >
              <iframe
                ref={frame}
                src="/live-preview"
                title="پیش‌نمایش پیش‌نویس سایت؛ هنوز منتشر نشده"
                onLoad={sendPreview}
                style={{
                  width: device === "mobile" ? 390 : 1200,
                  height: Math.max(620, 900 * scale) / scale,
                  transform: `scale(${scale})`,
                }}
              />
            </div>
          )}
          <span className="canvas-hint">
            تغییرات همین‌جا دیده می‌شوند. برای نمایش عمومی، سایت را منتشر کن.
          </span>
        </div>
      </div>
      {confirmation && (
        <Modal
          title={
            confirmation.kind === "item"
              ? "حذف آیتم"
              : confirmation.kind === "section"
                ? "حذف بخش"
                : confirmation.kind === "template"
                  ? "تغییر قالب"
                  : confirmation.kind === "publish"
                    ? demo
                      ? "ادامه در حساب کاربری"
                      : site.publishedAt
                        ? "انتشار تغییرات"
                        : "سایتت آماده انتشار است؟"
                    : "خروج از ویرایشگر"
          }
          onClose={() => {
            if (!busy) setConfirmation(null);
          }}
        >
          <div className="stack-form">
            <p>
              {confirmation.kind === "item"
                ? `آیتم «${confirmation.title}» از پیش‌نویس حذف شود؟ نسخه منتشرشده تا انتشار دوباره تغییر نمی‌کند.`
                : confirmation.kind === "section"
                  ? `بخش «${confirmation.title}» از پیش‌نویس حذف شود؟ سایت منتشرشده تا انتشار دوباره تغییر نمی‌کند.`
                  : confirmation.kind === "template"
                    ? `قالب «${confirmation.title}» جایگزین محتوای پیش‌نویس شود؟ محتوای صفحهٔ اصلی بازنشانی می‌شود؛ صفحه‌های اضافه و تغییراتشان نگه داشته می‌شوند.`
                    : confirmation.kind === "publish"
                      ? demo
                        ? "پیش‌نویس نمونه در همین مرورگر نگه داشته می‌شود. برای ساخت و انتشار سایت خودت وارد حساب شو؛ تغییرات نمونه خودکار منتقل نمی‌شوند."
                        : "با انتشار، تغییرات این ویرایشگر ذخیره می‌شوند و همین پیش‌نویس در دسترس همه قرار می‌گیرد. متن‌ها، تصاویر و نمای موبایل را بررسی کن."
                      : "تغییرات ذخیره نشده‌اند. پیش از خروج آن‌ها را ذخیره کن یا بدون ذخیره ادامه بده."}
            </p>
            {confirmation.kind === "publish" && !demo && (
              <div className="editor-hint">
                <p>
                  نشانی سایت:{" "}
                  <bdi dir="ltr">
                    {typeof window === "undefined"
                      ? ""
                      : window.location.origin}
                    /s/{site.slug}
                  </bdi>
                </p>
                <p>
                  {site.draft.sections
                    .filter((section) => section.enabled)
                    .length.toLocaleString("fa-IR")}{" "}
                  بخش در صفحهٔ اصلی و{" "}
                  {(site.draft.pages || [])
                    .filter((page) => page.enabled)
                    .length.toLocaleString("fa-IR")}{" "}
                  صفحهٔ مستقل قابل نمایش است. صفحه‌ها و بخش‌های غیرفعال نمایش
                  داده نمی‌شوند.
                </p>
                {site.draft.sections.every((section) => !section.enabled) && (
                  <p>
                    همه بخش‌ها پنهان‌اند؛ صفحه بدون محتوای بخش‌ها منتشر می‌شود.
                  </p>
                )}
              </div>
            )}
            {(confirmation.kind === "template" ||
              confirmation.kind === "publish" ||
              confirmation.kind === "leave") && (
              <Notice message={error} error />
            )}
            <div className="dialog-actions">
              <Button
                type="button"
                className="btn-outline"
                disabled={busy}
                onClick={() => setConfirmation(null)}
                autoFocus
              >
                انصراف
              </Button>
              <Button
                type="button"
                className={
                  confirmation.kind === "section" ||
                  confirmation.kind === "item"
                    ? "btn-danger"
                    : confirmation.kind === "leave"
                      ? "btn-outline"
                      : ""
                }
                loading={confirmation.kind !== "leave" && busy}
                disabled={confirmation.kind === "leave" && busy}
                onClick={() => void confirmChange()}
              >
                {confirmation.kind === "item"
                  ? "حذف آیتم"
                  : confirmation.kind === "section"
                    ? "حذف بخش"
                    : confirmation.kind === "template"
                      ? "تغییر قالب"
                      : confirmation.kind === "publish"
                        ? demo
                          ? "ذخیره نمونه و ورود"
                          : "ذخیره و انتشار"
                        : "خروج بدون ذخیره"}
              </Button>
              {confirmation.kind === "leave" && (
                <Button
                  type="button"
                  loading={operation === "save"}
                  disabled={busy}
                  onClick={async () => {
                    const href = confirmation.href;
                    if (await save()) {
                      allowNavigation.current = true;
                      location.href = href;
                    } else if (draftIssue(site)) {
                      setConfirmation(null);
                    }
                  }}
                >
                  ذخیره و خروج
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {linkedPage && (
        <CreatePageDialog
          pages={site.draft.pages || []}
          initialTitle={linkedPage.item.title}
          initialKind="service"
          onClose={() => setLinkedPage(null)}
          onCreate={(page: SitePage) => {
            const detail = {
              ...page,
              sections: page.sections.map((section) =>
                section.type === "hero"
                  ? {
                      ...section,
                      subtitle: linkedPage.item.description || "",
                      image: linkedPage.item.image,
                    }
                  : section,
              ),
            };
            mutate((current) => {
              const draft = withSections(current.draft, (items) =>
                items.map((section) =>
                  section.id === linkedPage.sectionId
                    ? {
                        ...section,
                        items: section.items?.map((item) =>
                          item.id === linkedPage.item.id
                            ? { ...item, pageId: page.id, url: undefined }
                            : item,
                        ),
                      }
                    : section,
                ),
              );
              return {
                ...current,
                draft: { ...draft, pages: [...(draft.pages || []), detail] },
              };
            });
            setSelectedPageId(page.id);
            setActive(page.sections[0]?.id || "");
            setTab("pages");
            setLinkedPage(null);
          }}
        />
      )}
      {add && (
        <Modal
          title="یک بخش تازه به صفحه اضافه کن"
          onClose={() => setAdd(false)}
        >
          <div className="add-section-grid">
            {(Object.entries(sectionLabels) as [SectionType, string][]).map(
              ([type, label]) => (
                <ActionButton
                  key={type}
                  disabled={busy || sections.length >= 40}
                  onClick={() => {
                    if (busy || sections.length >= 40) return;
                    const source = (
                      demo
                        ? createContent(site.templateId)
                        : createInitialContent(site.templateId)
                    ).sections.find((s) => s.type === type)!;
                    const section = {
                      ...source,
                      id: `${type}_${crypto.randomUUID()}`,
                      enabled: true,
                    };
                    updateSections((items) => [...items, section]);
                    setActive(section.id);
                    setAdd(false);
                  }}
                >
                  <LayoutTemplate size={22} />
                  {label}
                  <Plus size={15} />
                </ActionButton>
              ),
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

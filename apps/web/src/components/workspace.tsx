"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FocusScope, usePreventScroll } from "react-aria";
import Link from "next/link";
import {
  Site,
  TemplateId,
  Stats,
  templates,
  createDemoSite,
} from "@araland/shared";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Users,
  ClipboardList,
  FolderLock,
  Globe2,
  Sparkles,
  BookOpen,
  Settings,
  ArrowUpLeft,
  Plus,
  ChevronDown,
  Search,
  ArrowLeft,
  Eye,
  MousePointer2,
  TrendingUp,
  Check,
  Copy,
  ExternalLink,
  Menu,
  X,
  LogOut,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  FileText,
  Palette,
} from "lucide-react";
import {
  Brand,
  Button,
  ActionButton,
  Input,
  SelectField,
  Modal,
  Notice,
  SectionHeading,
  Empty,
} from "./ui";
import { TemplateCard, TemplatePreview } from "./template-card";
import { ManagementPanel } from "./management-panel";
import { request, json, getToken, fa } from "@/lib/client";
const nav = [
  { id: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { id: "templates", label: "قالب‌ها", icon: PanelsTopLeft },
  { id: "leads", label: "مخاطبان و پیام‌ها", icon: Users },
  { id: "forms", label: "فرم‌ها", icon: ClipboardList },
  { id: "files", label: "فایل‌های خصوصی", icon: FolderLock },
  { id: "posts", label: "بلاگ", icon: BookOpen },
  { id: "media", label: "استودیو هوش مصنوعی", icon: Sparkles },
  { id: "domains", label: "دامنه اختصاصی", icon: Globe2 },
  { id: "settings", label: "تنظیمات سایت", icon: Settings },
];
const demoStats: Stats = {
  visits: 12840,
  leads: 248,
  members: 86,
  conversion: 1.93,
  series: [
    { label: "شنبه", value: 20 },
    { label: "یکشنبه", value: 35 },
    { label: "دوشنبه", value: 26 },
    { label: "سه‌شنبه", value: 55 },
    { label: "چهارشنبه", value: 40 },
    { label: "پنجشنبه", value: 80 },
    { label: "جمعه", value: 68 },
  ],
};
export function Workspace() {
  const [view, setView] = useState("overview");
  const [site, setSite] = useState<Site>(createDemoSite());
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);
  const [demo, setDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [create, setCreate] = useState(false);
  const [menu, setMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const restoreDesktopSidebarFocus = useRef(false);
  const [stats, setStats] = useState<Stats>(demoStats);
  const [statsState, setStatsState] = useState({
    siteId: "demo",
    status: "ready",
    error: "",
  });
  const [statsRefresh, setStatsRefresh] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const dirtyRef = useRef(false);
  const historyIndex = useRef(0);
  const restoringHistory = useRef(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    action: () => void;
  } | null>(null);
  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);
  const guardNavigation = (action: () => void) => {
    if (dirtyRef.current) setPendingNavigation({ action });
    else action();
  };
  const [search, setSearch] = useState("");
  const [help, setHelp] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{
    templateId: TemplateId;
    siteId: string;
    siteName: string;
  } | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const templateRequestInFlight = useRef(false);
  const mobileMenuOpen = isMobile && menu;
  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  mobileMenuOpenRef.current = mobileMenuOpen;
  const nestedModalOpen =
    help || create || pendingTemplate !== null || pendingNavigation !== null;
  const nestedModalOpenRef = useRef(nestedModalOpen);
  nestedModalOpenRef.current = nestedModalOpen;
  usePreventScroll({ isDisabled: !mobileMenuOpen });
  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 760px)");
    const updateViewport = () => {
      const focusWasInside = sidebarRef.current?.contains(
        document.activeElement,
      );
      setIsMobile(breakpoint.matches);
      if (!breakpoint.matches) {
        restoreDesktopSidebarFocus.current = Boolean(
          focusWasInside || mobileMenuOpenRef.current,
        );
        setMenu(false);
      } else {
        restoreDesktopSidebarFocus.current = false;
      }
    };
    updateViewport();
    breakpoint.addEventListener("change", updateViewport);
    return () => {
      breakpoint.removeEventListener("change", updateViewport);
    };
  }, []);
  useEffect(() => {
    if (isMobile || nestedModalOpen || !restoreDesktopSidebarFocus.current)
      return;
    // A resize can remove the mobile focus target while its help dialog is open.
    const frame = requestAnimationFrame(() => {
      if (nestedModalOpenRef.current) return;
      restoreDesktopSidebarFocus.current = false;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== document.documentElement &&
        active.getClientRects().length &&
        !active.closest('[inert], [aria-hidden="true"]') &&
        getComputedStyle(active).visibility !== "hidden"
      )
        return;
      sidebarRef.current
        ?.querySelector<HTMLButtonElement>(
          ".sidebar-nav button.active, .sidebar-nav button",
        )
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [isMobile, nestedModalOpen]);
  const hasManagedSite = sites.some(
    (managedSite) => managedSite.id === site.id,
  );
  useEffect(() => {
    historyIndex.current = history.state?.aralandIndex || 0;
    history.replaceState(
      { ...history.state, aralandIndex: historyIndex.current },
      "",
    );
    const onPopState = (event: PopStateEvent) => {
      if (restoringHistory.current) {
        event.stopImmediatePropagation();
        restoringHistory.current = false;
        return;
      }
      const nextIndex = history.state?.aralandIndex;
      if (
        dirtyRef.current &&
        typeof nextIndex === "number" &&
        nextIndex !== historyIndex.current
      ) {
        event.stopImmediatePropagation();
        const delta = nextIndex - historyIndex.current;
        restoringHistory.current = true;
        history.go(-delta);
        setPendingNavigation({ action: () => history.go(delta) });
        return;
      }
      historyIndex.current = nextIndex || 0;
      const next = new URLSearchParams(location.search).get("view");
      setView(nav.some((item) => item.id === next) ? next! : "overview");
      setMenu(false);
      setSearch("");
      setMessage("");
      requestAnimationFrame(() => mainRef.current?.focus());
    };
    window.addEventListener("popstate", onPopState, true);
    return () => window.removeEventListener("popstate", onPopState, true);
  }, []);
  useEffect(() => {
    const query = new URLSearchParams(location.search).get("view");
    if (query && nav.some((n) => n.id === query)) setView(query);
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setDemo(false);
    setStats({ visits: 0, leads: 0, members: 0, conversion: 0, series: [] });
    request<{ sites: Site[] }>("/sites")
      .then((data) => {
        setSites(data.sites);
        setSitesLoaded(true);
        if (data.sites.length) {
          const saved =
            new URLSearchParams(location.search).get("site") ||
            localStorage.getItem("araland-site");
          setSite(data.sites.find((s) => s.id === saved) || data.sites[0]);
        } else {
          setCreate(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (demo || site.id === "demo") return;
    let current = true;
    localStorage.setItem("araland-site", site.id);
    setStatsState({ siteId: site.id, status: "loading", error: "" });
    request<Stats>(`/sites/${site.id}/stats`)
      .then((result) => {
        if (current) {
          setStats(result);
          setStatsState({ siteId: site.id, status: "ready", error: "" });
        }
      })
      .catch((err: Error) => {
        if (current)
          setStatsState({
            siteId: site.id,
            status: "error",
            error: err.message,
          });
      });
    return () => {
      current = false;
    };
  }, [demo, site.id, view, statsRefresh]);
  const statsReady =
    demo || (statsState.siteId === site.id && statsState.status === "ready");
  const statsFailed =
    !demo && statsState.siteId === site.id && statsState.status === "error";
  const isPublished = !demo && site.status === "PUBLISHED";
  const searchMatches = nav.filter((item) =>
    item.label
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .includes(search.trim().replace(/ي/g, "ی").replace(/ك/g, "ک")),
  );
  function changeView(id: string) {
    guardNavigation(() => {
      if (id !== view) {
        history.replaceState(
          { ...history.state, aralandIndex: historyIndex.current },
          "",
        );
        historyIndex.current += 1;
        history.pushState(
          { ...history.state, aralandIndex: historyIndex.current },
          "",
          id === "overview" ? "/" : `/?view=${id}`,
        );
      }
      setView(id);
      setMenu(false);
      setSearch("");
      setMessage("");
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        mainRef.current?.focus({ preventScroll: true });
      });
    });
  }
  function updated(s: Site) {
    setSite((current) => (current.id === s.id ? s : current));
    setSites((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }
  function selectTemplate(id: TemplateId) {
    if (templateRequestInFlight.current) return;
    if (demo) {
      location.href = `/login?template=${id}`;
      return;
    }
    if (!hasManagedSite) {
      setCreate(true);
      return;
    }
    setTemplateError("");
    setPendingTemplate({
      templateId: id,
      siteId: site.id,
      siteName: site.name,
    });
  }
  async function activateTemplate() {
    if (!pendingTemplate || templateRequestInFlight.current) return;
    templateRequestInFlight.current = true;
    setTemplateBusy(true);
    setTemplateError("");
    try {
      const data = await request<{ site: Site }>(
        `/sites/${pendingTemplate.siteId}/template`,
        json({ templateId: pendingTemplate.templateId }),
      );
      updated(data.site);
      setPendingTemplate(null);
      setMessage(
        "قالب تازه روی پیش‌نویس فعال شد. در ویرایشگر متن‌ها و تصاویر را بررسی کنید و سپس منتشر کنید.",
      );
    } catch (e) {
      setTemplateError((e as Error).message);
    } finally {
      templateRequestInFlight.current = false;
      setTemplateBusy(false);
    }
  }
  return (
    <div
      className="workspace"
      onClickCapture={(event) => {
        const anchor = (event.target as HTMLElement).closest?.("a[href]");
        if (
          dirtyRef.current &&
          anchor instanceof HTMLAnchorElement &&
          anchor.target !== "_blank" &&
          !anchor.hash &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          event.preventDefault();
          guardNavigation(() => {
            location.href = anchor.href;
          });
        }
      }}
    >
      <a className="skip-link" href="#workspace-main">
        رفتن به محتوای اصلی
      </a>
      <FocusScope
        key={mobileMenuOpen ? "mobile-sidebar-open" : "sidebar-idle"}
        contain={mobileMenuOpen && !nestedModalOpen}
        autoFocus={mobileMenuOpen}
        restoreFocus={mobileMenuOpen}
      >
        <aside
          ref={sidebarRef}
          id="workspace-sidebar"
          className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}
          role={mobileMenuOpen ? "dialog" : undefined}
          aria-label="فهرست فضای کار"
          aria-modal={mobileMenuOpen && !nestedModalOpen ? true : undefined}
          aria-hidden={
            isMobile && (!menu || nestedModalOpen) ? true : undefined
          }
          inert={isMobile && (!menu || nestedModalOpen)}
          onKeyDown={(event) => {
            if (
              mobileMenuOpen &&
              !nestedModalOpen &&
              event.key === "Escape" &&
              !event.defaultPrevented
            ) {
              event.preventDefault();
              event.stopPropagation();
              setMenu(false);
            }
          }}
        >
          <div className="sidebar-brand">
            <Brand />
            <ActionButton
              className="icon-btn mobile-close"
              aria-label="بستن منو"
              onClick={() => setMenu(false)}
            >
              <X size={20} />
            </ActionButton>
          </div>
          <div className="workspace-picker">
            <span className="workspace-avatar">
              {demo || hasManagedSite ? "م" : "+"}
            </span>
            <div>
              <b>
                {demo || hasManagedSite
                  ? site.name
                  : loading
                    ? "در حال دریافت سایت‌ها…"
                    : sitesLoaded
                      ? "هنوز سایتی ندارید"
                      : "فضای کاری شما"}
              </b>
              <small>{demo ? "فضای کاری نمونه" : "فضای کاری شما"}</small>
            </div>

            {!demo && sites.length > 1 && (
              <SelectField
                className="workspace-site-select"
                aria-label="انتخاب سایت"
                value={site.id}
                onChange={(id) => {
                  const selected = sites.find((s) => s.id === id);
                  if (selected)
                    guardNavigation(() => {
                      setSite(selected);
                      setMessage("");
                      setMenu(false);
                    });
                }}
                options={sites.map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
          </div>
          <span className="nav-group-title">فضای کار شما</span>
          <nav className="sidebar-nav">
            {nav.map((item) => (
              <ActionButton
                key={item.id}
                className={view === item.id ? "active" : ""}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => changeView(item.id)}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.id === "media" && <small>جدید</small>}
                {item.id === "leads" && demo && <b className="nav-count">۸</b>}
              </ActionButton>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="mobile-promo">
              <div className="mobile-promo-icon">
                <Smartphone size={23} />
                <span />
              </div>
              <b>کسب‌وکارت، همیشه همراهت</b>
              <p>با اپ آرالند، از هرجا سایتت را مدیریت کن.</p>
              <ActionButton onClick={() => setHelp(true)}>
                آشنایی با اپ <ArrowUpLeft size={16} />
              </ActionButton>
            </div>
            <ActionButton
              className="support-link"
              onClick={() => setHelp(true)}
            >
              <HelpCircle size={18} />
              راهنمای شروع
              <ArrowUpLeft size={16} />
            </ActionButton>
            <div className="sidebar-user">
              <span className="user-avatar">{demo ? "آ" : "ش"}</span>
              <div>
                <b>{demo ? "مهمان آرالند" : "حساب کاربری شما"}</b>
                <small>
                  {demo ? "یک ایده، هزار امکان" : "مدیریت کسب‌وکار"}
                </small>
              </div>
              {demo ? (
                <Link href="/login" className="icon-btn" aria-label="ورود">
                  <ArrowUpLeft size={18} />
                </Link>
              ) : (
                <ActionButton
                  className="icon-btn"
                  aria-label="خروج"
                  onClick={() =>
                    guardNavigation(async () => {
                      try {
                        await request("/auth/logout", json({}));
                      } catch {
                        /* Local sign-out remains available when offline. */
                      }
                      localStorage.removeItem("araland-token");
                      location.href = "/";
                    })
                  }
                >
                  <LogOut size={18} />
                </ActionButton>
              )}
            </div>
          </div>
        </aside>
      </FocusScope>
      {mobileMenuOpen && (
        <ActionButton
          className="sidebar-scrim"
          aria-label="بستن فهرست"
          aria-hidden="true"
          excludeFromTabOrder
          preventFocusOnPress
          onClick={() => setMenu(false)}
        />
      )}
      <div
        className="workspace-body"
        inert={mobileMenuOpen}
        aria-hidden={mobileMenuOpen ? true : undefined}
      >
        <header className="topbar">
          <div className="breadcrumb">
            <ActionButton
              className="icon-btn mobile-toggle"
              onClick={() => setMenu(true)}
              aria-label="نمایش فهرست"
              aria-expanded={mobileMenuOpen}
              aria-controls="workspace-sidebar"
            >
              <Menu size={22} />
            </ActionButton>
            <span>فضای کار</span>
            <span>/</span>
            <b>{nav.find((x) => x.id === view)?.label}</b>
          </div>
          <div className="topbar-actions">
            <div
              className="search-box"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setSearch("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearch("");
                if (
                  event.key === "Enter" &&
                  event.target instanceof HTMLInputElement &&
                  search &&
                  searchMatches[0]
                ) {
                  event.preventDefault();
                  changeView(searchMatches[0].id);
                }
                if (
                  event.key === "ArrowDown" &&
                  event.target instanceof HTMLInputElement
                ) {
                  event.preventDefault();
                  event.currentTarget
                    .querySelector<HTMLButtonElement>(".search-results button")
                    ?.focus();
                }
              }}
            >
              <Search size={17} />
              <Input
                aria-label="جستجو در بخش‌ها"
                placeholder="جستجوی بخش‌های پنل"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌕</kbd>
              {search && (
                <div className="search-results">
                  {searchMatches.map((n) => (
                    <ActionButton key={n.id} onClick={() => changeView(n.id)}>
                      <n.icon size={16} />
                      {n.label}
                      <ArrowUpLeft size={14} />
                    </ActionButton>
                  ))}
                  {!searchMatches.length && <p>بخشی پیدا نشد.</p>}
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            {demo ? (
              <Link href="/login" className="topbar-login">
                ورود به حساب <ArrowUpLeft size={16} />
              </Link>
            ) : (
              <span className="connection-status">
                <i />
                حساب مدیریت سایت
              </span>
            )}
          </div>
        </header>
        <main
          id="workspace-main"
          ref={mainRef}
          tabIndex={-1}
          aria-label={nav.find((item) => item.id === view)?.label}
          className="dashboard-main"
        >
          <Notice message={error} error />
          <Notice message={message} />
          {loading ? (
            <div className="loading-screen">
              <span className="loading-dot" />
              در حال آماده‌سازی فضای شما…
            </div>
          ) : !demo && !hasManagedSite ? (
            <section className="panel content-panel">
              <Empty
                title={
                  sitesLoaded
                    ? "اولین سایت کسب‌وکارت را بساز"
                    : "اطلاعات سایت‌ها دریافت نشد"
                }
                description={
                  sitesLoaded
                    ? "هنوز سایتی در حساب شما نیست. نام کسب‌وکار، آدرس و قالب دلخواهت را انتخاب کن تا فضای مدیریت سایتت آماده شود."
                    : "برای دیدن سایت‌ها و ادامه مدیریت، دریافت اطلاعات را دوباره امتحان کنید."
                }
              >
                {!sitesLoaded && /ورود|وارد|نشست|توکن/.test(error) && (
                  <Link href="/login" className="btn">
                    ورود دوباره به حساب
                  </Link>
                )}
                <Button
                  type="button"
                  onClick={() =>
                    sitesLoaded ? setCreate(true) : location.reload()
                  }
                >
                  {sitesLoaded ? (
                    <>
                      <Plus size={17} />
                      ساخت اولین سایت
                    </>
                  ) : (
                    "تلاش دوباره"
                  )}
                </Button>
              </Empty>
            </section>
          ) : (
            <>
              {demo && view !== "overview" && (
                <div className="demo-strip">
                  <span>شما در حال دیدن فضای نمونه هستید.</span>
                  <Link href="/login">
                    ورود و شروع رایگان <ArrowLeft size={15} />
                  </Link>
                </div>
              )}
              {view === "overview" ? (
                <>
                  <div className="dashboard-greeting">
                    <div>
                      <div className="greeting-eyebrow">
                        <span className="tiny-sun">☀</span>امروز، یک فرصت
                        تازه‌ست
                      </div>
                      <h1>
                        {demo
                          ? "سلام، به فضای رشدت خوش اومدی"
                          : `مدیریت ${site.name}`}{" "}
                        <span className="wave">✳</span>
                      </h1>
                      <p>
                        {demo
                          ? "امکانات را با داده‌های نمونه ببین؛ برای ساخت سایت خودت وارد شو."
                          : "از اینجا سایتت را آماده کن، منتشر کن و با مخاطبان در ارتباط باش."}
                      </p>
                    </div>
                    <Button
                      className="btn-outline"
                      onClick={() =>
                        demo ? (location.href = "/login") : setCreate(true)
                      }
                    >
                      <Plus size={18} />
                      ساخت سایت جدید
                    </Button>
                  </div>
                  <section className="welcome-banner">
                    <div className="welcome-content">
                      <span className="welcome-label">
                        <i />
                        از یک ایده، تا یک وب‌سایت
                      </span>
                      <h2>
                        {demo ? (
                          <>
                            کسب‌وکارت کوچیک نیست.
                            <br />
                            دنیای دیجیتالش رو <em>بزرگ کن.</em>
                          </>
                        ) : isPublished ? (
                          <>
                            سایتت منتشر شده.
                            <br />
                            <em>با مخاطب‌ها در ارتباط باش.</em>
                          </>
                        ) : (
                          <>
                            اولین قدم، محتوای خودت.
                            <br />
                            <em>سایتت را آمادهٔ انتشار کن.</em>
                          </>
                        )}
                      </h2>
                      <p>
                        {demo
                          ? "طراحی کن، منتشر کن و به آدم‌های بیشتری برس."
                          : isPublished
                            ? "سایت را ببین و آدرس آن را به اشتراک بگذار. پاسخ‌های فرم‌ها را در بخش مخاطبان دنبال کن."
                            : "متن‌ها، تصاویر و فرم ارتباط را بررسی کن؛ پیش‌نمایش را ببین و سپس سایت را منتشر کن. تا آن زمان سایت عمومی نیست."}
                      </p>
                      <div className="welcome-actions">
                        <Link
                          className="btn btn-light"
                          href={
                            demo
                              ? "/login"
                              : isPublished
                                ? `/s/${site.slug}`
                                : `/editor/${site.id}`
                          }
                          target={isPublished ? "_blank" : undefined}
                          rel={isPublished ? "noopener noreferrer" : undefined}
                        >
                          {demo
                            ? "بیا سایتت رو بسازیم"
                            : isPublished
                              ? "مشاهده سایت منتشرشده"
                              : "ویرایش و آماده‌سازی سایت"}
                          <ArrowUpLeft size={19} />
                        </Link>
                        <ActionButton
                          onClick={() =>
                            changeView(
                              demo
                                ? "templates"
                                : isPublished
                                  ? "leads"
                                  : "forms",
                            )
                          }
                        >
                          {demo
                            ? "کشف قالب‌ها"
                            : isPublished
                              ? "پیگیری پاسخ‌های فرم"
                              : "بررسی فرم ارتباط"}{" "}
                          <ArrowLeft size={16} />
                        </ActionButton>
                      </div>
                    </div>
                    <div className="welcome-art" aria-hidden="true">
                      <div className="orbit-line line-one" />
                      <div className="orbit-line line-two" />
                      <span className="floating-spark spark-one">✳</span>
                      <span className="floating-spark spark-two">✦</span>
                      <div className="floating-pill pill-top">
                        <span className="pill-dot" />
                        ایده‌ات رو به دنیا نشون بده
                      </div>
                      <div className="mini-browser">
                        <div className="browser-bar">
                          <span />
                          <span />
                          <span />
                          <div>
                            madar.araland.site <Globe2 size={8} />
                          </div>
                        </div>
                        <div className="mini-site">
                          <span className="mini-site-brand">
                            madar<span>®</span>
                          </span>
                          <div className="mini-site-title">
                            هر فضا،
                            <br />
                            یک <i>داستان تازه.</i>
                          </div>
                          <div className="mini-site-img">
                            <img
                              src={templates[0].image}
                              alt="پیش‌نمایش قالب معماری مدار"
                            />
                          </div>
                          <span className="mini-site-bottom">
                            طراحی برای زندگی بهتر <ArrowUpLeft size={11} />
                          </span>
                        </div>
                      </div>
                      <div className="floating-pill pill-bottom">
                        <span className="success-circle">
                          <Check size={14} />
                        </span>
                        <div>
                          <b>آماده برای دیده شدن</b>
                          <small>زیبا در هر صفحه‌نمایش</small>
                        </div>
                        <div className="pill-devices">
                          <Smartphone size={19} />
                          <PanelsTopLeft size={24} />
                        </div>
                      </div>
                    </div>
                  </section>
                  <div className="overview-section-label">
                    <h2>یک نگاه به کسب‌وکارت</h2>
                    <span>
                      {demo
                        ? "آمار نمایشی برای آشنایی با محصول"
                        : "آمار ثبت‌شده سایت شما"}
                      <span className="period-chip">
                        {demo ? "۷ روز نمونه" : "از آغاز فعالیت"}
                      </span>
                    </span>
                  </div>
                  {statsFailed && (
                    <div className="stats-feedback">
                      <Notice
                        error
                        message={`آمار دریافت نشد. ${statsState.error}`}
                      />
                      <Button
                        type="button"
                        className="btn-outline btn-small"
                        onClick={() => setStatsRefresh((n) => n + 1)}
                      >
                        تلاش دوباره برای آمار
                      </Button>
                    </div>
                  )}
                  {!statsReady && !statsFailed && (
                    <p className="muted" role="status">
                      در حال دریافت آمار…
                    </p>
                  )}
                  <div
                    className="stats-grid"
                    aria-busy={!statsReady && !statsFailed}
                  >
                    {[
                      {
                        label: "بازدید سایت",
                        value: stats.visits,
                        icon: Eye,
                        color: "green",
                        note: "بازدیدهای ثبت‌شده",
                      },
                      {
                        label: "پاسخ‌های فرم",
                        value: stats.leads,
                        icon: MousePointer2,
                        color: "orange",
                        note: "پاسخ‌های دریافت‌شده",
                      },
                      {
                        label: "اعضای سایت",
                        value: stats.members,
                        icon: Users,
                        color: "purple",
                        note: "مخاطبان ثبت‌نام‌کرده",
                      },
                      {
                        label: "نرخ تبدیل",
                        value: stats.conversion,
                        icon: TrendingUp,
                        color: "blue",
                        note: "نسبت پاسخ‌ها به بازدید",
                        suffix: "٪",
                      },
                    ].map((stat, i) => (
                      <article className="stat-card" key={stat.label}>
                        <div>
                          <span>{stat.label}</span>
                          <span className={`stat-icon ${stat.color}`}>
                            <stat.icon size={18} />
                          </span>
                        </div>
                        <div className="stat-value">
                          <b>
                            {statsReady
                              ? `${fa(stat.value)}${stat.suffix || ""}`
                              : "—"}
                          </b>
                          {demo && (
                            <span className="stat-growth">
                              ↗ {["۱۸", "۱۲", "۸", "۲٫۴"][i]}٪
                            </span>
                          )}
                        </div>
                        <small>
                          {stat.note}
                          {demo ? " · نمونه" : ""}
                        </small>
                        {demo && (
                          <svg
                            className={`stat-sparkline sparkline-${i}`}
                            width="100"
                            height="33"
                            viewBox="0 0 100 33"
                            aria-hidden="true"
                          >
                            <path
                              d={
                                [
                                  "M0 29 L10 22 L20 25 L30 16 L40 18 L50 10 L60 15 L70 6 L80 10 L90 3 L100 1",
                                  "M0 28 L12 23 L24 25 L36 15 L48 17 L60 10 L72 13 L84 4 L100 1",
                                  "M0 25 L12 28 L24 17 L36 20 L48 12 L60 14 L72 8 L84 10 L100 1",
                                  "M0 27 L12 24 L24 25 L36 17 L48 22 L60 12 L72 14 L84 8 L100 2",
                                ][i]
                              }
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                        )}
                      </article>
                    ))}
                  </div>
                  <div className="dashboard-middle">
                    <section className="site-overview panel">
                      <div className="panel-heading">
                        <h2>وب‌سایت من</h2>
                        <ActionButton
                          onClick={() => setCreate(true)}
                          className="text-btn"
                        >
                          {demo ? "شروع ساخت" : "سایت جدید"}
                          <Plus size={14} />
                        </ActionButton>
                      </div>
                      <div className="site-overview-body">
                        <div className="site-thumbnail">
                          <TemplatePreview id={site.templateId} />
                          <span className="thumbnail-caption">
                            نمای نمونهٔ قالب
                          </span>
                        </div>
                        <div className="site-info">
                          <span
                            className={`status-label ${site.status === "PUBLISHED" ? "published" : ""}`}
                          >
                            <i />
                            {demo
                              ? "سایت نمونه"
                              : site.status === "PUBLISHED"
                                ? "منتشر شده"
                                : "پیش‌نویس"}
                          </span>
                          <h3>{site.name}</h3>
                          <span className="site-address" dir="ltr">
                            {demo
                              ? `${site.slug}.araland.site`
                              : `${typeof window === "undefined" ? "" : window.location.host}/s/${site.slug}`}{" "}
                            <Globe2 size={12} />
                          </span>
                          <p>
                            قالب{" "}
                            {
                              templates.find((t) => t.id === site.templateId)
                                ?.name
                            }
                            <span>·</span>
                            {fa(
                              site.draft.sections.filter((s) => s.enabled)
                                .length,
                            )}{" "}
                            بخش فعال
                          </p>
                          <div className="site-buttons">
                            {isPublished && (
                              <Button
                                type="button"
                                className="btn-small btn-outline"
                                onClick={async () => {
                                  setError("");
                                  try {
                                    await navigator.clipboard.writeText(
                                      new URL(
                                        `/s/${site.slug}`,
                                        location.origin,
                                      ).href,
                                    );
                                    setMessage(
                                      "آدرس سایت کپی شد؛ آن را با مخاطبان به اشتراک بگذار.",
                                    );
                                  } catch {
                                    setError(
                                      "کپی خودکار انجام نشد. آدرس نمایش‌داده‌شده سایت را انتخاب و کپی کن.",
                                    );
                                  }
                                }}
                              >
                                <Copy size={15} />
                                کپی آدرس سایت
                              </Button>
                            )}
                            <Link
                              className="btn btn-small"
                              href={
                                demo ? "/editor/demo" : `/editor/${site.id}`
                              }
                            >
                              <Palette size={15} />
                              ویرایش سایت
                            </Link>
                            <Link
                              className="btn btn-small btn-outline"
                              href={
                                demo
                                  ? `/preview/${site.templateId}`
                                  : site.status === "PUBLISHED"
                                    ? `/s/${site.slug}`
                                    : `/editor/${site.id}`
                              }
                            >
                              <Eye size={15} />
                              {demo
                                ? "پیش‌نمایش قالب"
                                : isPublished
                                  ? "مشاهده سایت"
                                  : "پیش‌نمایش و انتشار"}
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="site-footer">
                        <span>
                          <span className="small-check">
                            <Check size={10} />
                          </span>
                          {demo
                            ? "این سایت برای نمایش امکانات ساخته شده است."
                            : "طراحی و تنظیمات با انتشار به‌روز می‌شوند؛ فرم‌ها و مقالات انتشار جدا دارند."}
                        </span>
                        <span>ساخته‌شده با آرالند</span>
                      </div>
                    </section>
                    <section className="checklist panel">
                      <div className="panel-heading">
                        <h2>قدم‌به‌قدم تا اولین مخاطب</h2>
                        <span className="step-count">
                          {fa(
                            1 +
                              (isPublished ? 1 : 0) +
                              (!demo && statsReady && stats.leads > 0 ? 1 : 0),
                          )}{" "}
                          از ۳
                        </span>
                      </div>
                      <div className="progress-track" aria-hidden="true">
                        <span
                          style={{
                            width: `${((1 + (isPublished ? 1 : 0) + (!demo && statsReady && stats.leads > 0 ? 1 : 0)) / 3) * 100}%`,
                          }}
                        />
                      </div>
                      {[
                        {
                          title: "ساخت سایت و انتخاب قالب",
                          subtitle: demo
                            ? "نمونه‌ای برای آشنایی با امکانات"
                            : "سایت شما ساخته شده است",
                          done: true,
                          action: () => changeView("templates"),
                        },
                        {
                          title: "بررسی محتوا و انتشار سایت",
                          subtitle: isPublished
                            ? "سایت منتشر شده؛ برای ویرایش دوباره باز کن"
                            : "متن، تصویر و فرم را بررسی کن؛ سپس منتشر کن",
                          done: isPublished,
                          action: () =>
                            (location.href = `/editor/${demo ? "demo" : site.id}`),
                        },
                        {
                          title: "دریافت و پیگیری اولین پاسخ",
                          subtitle:
                            !demo && statsReady && stats.leads > 0
                              ? "پاسخ‌ها را در بخش مخاطبان ببین"
                              : "پس از انتشار، آدرس سایت را به اشتراک بگذار",
                          done: !demo && statsReady && stats.leads > 0,
                          action: () => changeView("leads"),
                        },
                      ].map((item, i) => (
                        <ActionButton
                          className={`checklist-item ${item.done ? "completed" : ""}`}
                          onClick={item.action}
                          key={item.title}
                        >
                          <span
                            className="step-circle"
                            aria-label={item.done ? "انجام شده" : "انجام نشده"}
                          >
                            {item.done ? <Check size={13} /> : fa(i + 1)}
                          </span>
                          <span>
                            <b>{item.title}</b>
                            <small>{item.subtitle}</small>
                          </span>
                          <ArrowUpLeft size={16} />
                        </ActionButton>
                      ))}
                      <ActionButton
                        className="checklist-item optional-step"
                        onClick={() => changeView("domains")}
                      >
                        <Globe2 size={20} />
                        <span>
                          <b>دامنه اختصاصی · اختیاری</b>
                          <small>برای شروع، آدرس پیش‌فرض سایت کافی است.</small>
                        </span>
                        <ArrowUpLeft size={16} />
                      </ActionButton>
                    </section>
                  </div>
                  <SectionHeading
                    eyebrow="از اینجا الهام بگیر"
                    title="یک قالب، هزار امکان"
                    description="با یک طراحی حرفه‌ای شروع کن و به سلیقه خودت تغییرش بده."
                  >
                    <ActionButton
                      className="text-btn"
                      onClick={() => changeView("templates")}
                    >
                      مشاهده همه قالب‌ها <ArrowLeft size={17} />
                    </ActionButton>
                  </SectionHeading>
                  <div className="template-grid">
                    {templates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        id={t.id}
                        onSelect={selectTemplate}
                        selected={!demo && site.templateId === t.id}
                      />
                    ))}
                  </div>
                  <div className="dashboard-bottom-note">
                    <span className="tiny-star">✳</span>ایده‌های بزرگ، با یک قدم
                    کوچک شروع می‌شن.<span>ساخته‌شده برای رشد تو</span>
                  </div>
                </>
              ) : view === "templates" ? (
                <>
                  <SectionHeading
                    eyebrow="با طراحی خوب شروع کن"
                    title="کدام قالب، شبیه کسب‌وکار توست؟"
                    description="سه شخصیت متفاوت. بی‌نهایت راه برای ساختن چیزی که مال خودت باشد."
                  />
                  <div className="template-filter">
                    <span className="filter-active">
                      همه قالب‌ها <b>۳</b>
                    </span>
                    {templates.map((t) => (
                      <a key={t.id} href={`#template-${t.id}`}>
                        {t.category}
                      </a>
                    ))}
                  </div>
                  <div className="template-grid full-gallery">
                    {templates.map((t) => (
                      <div key={t.id} id={`template-${t.id}`}>
                        <TemplateCard
                          id={t.id}
                          onSelect={selectTemplate}
                          selected={!demo && site.templateId === t.id}
                        />
                        <p className="template-description">{t.description}</p>
                        <div className="template-tags">
                          {t.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                          <span>واکنش‌گرا</span>
                          <span>قابل ویرایش</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="gallery-footnote">
                    <Sparkles size={20} />
                    <div>
                      <h3>طراحی آماده، هویت خودت</h3>
                      <p>
                        رنگ‌ها، تصاویر، متن‌ها و ترتیب هر بخش را تغییر بده. تمام
                        قالب‌ها فرم، بلاگ، FAQ و استوری دارند.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <ManagementPanel
                  key={`${site.id}-${view}`}
                  view={view}
                  site={site}
                  demo={demo}
                  onUpdate={updated}
                  onDirtyChange={onDirtyChange}
                />
              )}
            </>
          )}
        </main>
      </div>
      {pendingNavigation && (
        <Modal
          title="تغییرات ذخیره نشده‌اند"
          onClose={() => setPendingNavigation(null)}
        >
          <div className="stack-form">
            <p>
              با رفتن به بخش دیگر، تغییرات این صفحه از دست می‌روند. برای
              نگه‌داشتن آن‌ها، به ویرایش برگرد و ذخیره کن.
            </p>
            <Button type="button" onClick={() => setPendingNavigation(null)}>
              بازگشت به ویرایش
            </Button>
            <Button
              type="button"
              className="btn-danger"
              onClick={() => {
                const action = pendingNavigation.action;
                dirtyRef.current = false;
                setPendingNavigation(null);
                action();
              }}
            >
              خروج بدون ذخیره
            </Button>
          </div>
        </Modal>
      )}
      {pendingTemplate && (
        <Modal
          title="فعال‌سازی قالب"
          onClose={() => {
            if (!templateRequestInFlight.current) setPendingTemplate(null);
          }}
        >
          <div className="stack-form">
            <p>
              قالب «
              {
                templates.find(
                  (template) => template.id === pendingTemplate.templateId,
                )?.name
              }
              » روی سایت «{pendingTemplate.siteName}» فعال شود؟
            </p>
            <p className="muted">
              محتوای پیش‌نویس با محتوای اولیه این قالب جایگزین می‌شود. نسخه
              منتشرشده تا انتشار بعدی حفظ می‌شود.
            </p>
            <Notice message={templateError} error />
            <Button
              type="button"
              loading={templateBusy}
              disabled={templateBusy}
              onClick={activateTemplate}
            >
              فعال‌سازی قالب <Check size={17} />
            </Button>
            <Button
              type="button"
              className="btn-outline"
              disabled={templateBusy}
              onClick={() => {
                if (!templateRequestInFlight.current) setPendingTemplate(null);
              }}
            >
              انصراف
            </Button>
          </div>
        </Modal>
      )}
      {create && (
        <CreateSiteModal
          demo={demo}
          onClose={() => setCreate(false)}
          onCreated={(s) => {
            setSites((prev) => [...prev, s]);
            setSite(s);
            setCreate(false);
            changeView("overview");
            setMessage(
              "سایت شما ساخته شد. قدم بعدی: ویرایش و آماده‌سازی محتوا، سپس انتشار سایت.",
            );
          }}
        />
      )}
      {help && (
        <Modal
          title="راهنمای شروع و مدیریت سایت"
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>
              از آماده‌سازی سایت تا پاسخ به مخاطب، این مسیر را دنبال کن. دامنه
              اختصاصی برای شروع ضروری نیست.
            </p>
            <h3>سه قدم تا سایت شما</h3>
            <ol>
              <li>
                با شماره موبایل وارد شوید و یک نام و آدرس برای سایت انتخاب کنید.
              </li>
              <li>
                قالب را انتخاب کنید و در ویرایشگر متن و تصاویر را تغییر دهید.
              </li>
              <li>فرم ارتباط را بسازید و سایت را منتشر کنید.</li>
            </ol>
            <p>
              بعد از انتشار، آدرس سایت را به اشتراک بگذار. پاسخ فرم‌ها و اعضای
              ثبت‌نام‌کرده را در «مخاطبان و پیام‌ها» ببین؛ فایل خصوصی را با
              شماره گیرنده در «فایل‌های خصوصی» ارسال کن.
            </p>
            <Notice message="فرم‌ها و مقالات منتشرشده فوراً به‌روز می‌شوند. طراحی و تنظیمات سایت به انتشار دوباره نیاز دارند." />
            <Button
              type="button"
              onClick={() => {
                setHelp(false);
                setMenu(false);
                guardNavigation(() => {
                  if (demo) location.href = "/login";
                  else if (hasManagedSite) location.href = `/editor/${site.id}`;
                  else setCreate(true);
                });
              }}
            >
              {demo || !hasManagedSite
                ? "شروع ساخت سایت"
                : "باز کردن ویرایشگر سایت"}
              <ArrowUpLeft size={17} />
            </Button>
            <p className="muted">
              نسخه فروشگاهی اپ هنوز در دسترس نیست؛ فعلاً می‌توانی همین پنل را در
              مرورگر گوشی هم استفاده کنی.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function CreateSiteModal({
  demo,
  onClose,
  onCreated,
}: {
  demo: boolean;
  onClose: () => void;
  onCreated: (site: Site) => void;
}) {
  const [busy, setBusy] = useState(false);
  const requestInFlight = useRef(false);
  const [slug, setSlug] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<TemplateId>("orbit");
  useEffect(() => {
    setOrigin(location.origin);
    const preferred = localStorage.getItem("araland-preferred-template");
    if (templates.some((t) => t.id === preferred))
      setTemplate(preferred as TemplateId);
  }, []);
  return (
    <Modal
      title="یک فضای تازه برای کسب‌وکارت"
      onClose={() => {
        if (!requestInFlight.current) onClose();
      }}
    >
      <form
        className="stack-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (requestInFlight.current) return;
          if (demo) {
            location.href = `/login?template=${template}`;
            return;
          }
          const values = Object.fromEntries(new FormData(e.currentTarget));
          const name = String(values.name || "").trim();
          if (!name) {
            setError("نام کسب‌وکار را وارد کنید.");
            return;
          }
          requestInFlight.current = true;
          setBusy(true);
          setError("");
          try {
            const data = await request<{ site: Site }>(
              "/sites",
              json({ name, slug, templateId: template }),
            );
            localStorage.removeItem("araland-preferred-template");
            onCreated(data.site);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            requestInFlight.current = false;
            setBusy(false);
          }
        }}
      >
        <p className="muted">
          سایت ابتدا به‌صورت پیش‌نویس ساخته می‌شود. نام، محتوا و قالب را بعداً
          می‌توانی تغییر بدهی؛ آدرس پیش‌فرض ثابت می‌ماند.
        </p>
        <label>
          نام کسب‌وکار
          <Input
            name="name"
            disabled={busy}
            autoComplete="organization"
            placeholder="مثلاً استودیو مدار"
            required
            maxLength={100}
          />
        </label>
        <label>
          آدرس سایت
          <Input
            name="slug"
            aria-label="آدرس سایت"
            aria-describedby="create-slug-help"
            disabled={busy}
            value={slug}
            onChange={(event) =>
              setSlug(event.target.value.toLowerCase().trim())
            }
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
            dir="ltr"
            placeholder="my-business"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            minLength={3}
            maxLength={63}
          />
          <small id="create-slug-help">
            ۳ تا ۶۳ کاراکتر؛ حروف انگلیسی کوچک، عدد و خط تیره بین کلمات.
          </small>
          <small className="slug-preview" dir="ltr">
            {origin}/s/{slug || "my-business"}
          </small>
        </label>
        <span id="create-template-label">قالب شروع</span>
        <div
          className="template-options"
          role="group"
          aria-labelledby="create-template-label"
        >
          {templates.map((t) => (
            <ActionButton
              type="button"
              key={t.id}
              disabled={busy}
              aria-pressed={template === t.id}
              className={template === t.id ? "chosen" : ""}
              onClick={() => setTemplate(t.id)}
            >
              <span style={{ background: t.color }} />
              {t.name}
              {template === t.id && <Check size={14} />}
            </ActionButton>
          ))}
        </div>
        <Notice message={error} error />
        <Button loading={busy} type="submit">
          ساخت سایت <ArrowUpLeft size={17} />
        </Button>
      </form>
    </Modal>
  );
}

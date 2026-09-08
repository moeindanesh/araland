"use client";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  Site,
  SiteForm,
  Post,
  Section,
  SectionItem,
  SectionType,
  SiteContent,
} from "@araland/shared";
import {
  ArrowUpLeft,
  ArrowLeft,
  Plus,
  Minus,
  Instagram,
  X,
  Check,
  Play,
  MoveUpRight,
} from "lucide-react";
import { request, json } from "@/lib/client";
import { createSiteLinks, visibleSiteSections } from "@/lib/site-links";
import { PublicSiteHeader, PublicSiteFooter } from "./public-site-chrome";
import { NicheHero } from "./niche-hero";
import { Notice } from "./ui";
export function LandingPage({
  site,
  forms = [],
  posts = [],
  preview = false,
  embedded = false,
  pageId,
  siteBasePath = `/s/${site.slug}`,
}: {
  site: Site;
  forms?: SiteForm[];
  posts?: Post[];
  preview?: boolean;
  embedded?: boolean;
  pageId?: string;
  siteBasePath?: string;
}) {
  const content = preview ? site.draft : site.published || site.draft;
  const [previewPageId, setPreviewPageId] = useState(pageId);
  const [story, setStory] = useState<SectionItem | null>(null);
  const pendingAnchor = useRef<string | null>(null);
  const currentPageId = preview ? previewPageId : pageId;
  const page = content.pages?.find((page) => page.id === currentPageId);
  const sections = visibleSiteSections(page?.sections || content.sections, posts.length > 0);
  const links = createSiteLinks(content, siteBasePath, page?.id, posts.length > 0);
  const { anchors, resolveLink } = links;
  useEffect(() => {
    setPreviewPageId(pageId);
  }, [pageId]);
  useEffect(() => {
    if (!preview) return;
    if (pendingAnchor.current) {
      document.getElementById(pendingAnchor.current)?.scrollIntoView();
      pendingAnchor.current = null;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [previewPageId, preview]);
  const navigatePreview = (
    event: MouseEvent<HTMLElement>,
    element = event.currentTarget as HTMLAnchorElement,
  ) => {
    if (!preview || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const destination = new URL(element.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (element.getAttribute("href")?.startsWith("#")) return;
    const target = content.pages?.find(
      (candidate) => `${siteBasePath}/${encodeURIComponent(candidate.slug)}` === destination.pathname,
    );
    const isHome = destination.pathname === links.homeHref;
    if (!target && !isHome) return;
    event.preventDefault();
    const nextPageId = target?.id;
    const anchor = destination.hash ? decodeURIComponent(destination.hash.slice(1)) : null;
    if (nextPageId === previewPageId) {
      if (anchor) document.getElementById(anchor)?.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      pendingAnchor.current = anchor;
      setPreviewPageId(nextPageId);
    }
    if (embedded)
      window.parent.postMessage({ type: "araland-preview-page", pageId: nextPageId || "" }, window.location.origin);
    setStory(null);
  };
  useEffect(() => {
    if (!preview && !embedded)
      request(`/public/sites/${site.slug}/visit`, json({})).catch(() => {});
  }, [site.slug, pageId, preview, embedded]);
  return (
    <div
      className={`landing landing-${site.templateId} ${embedded ? "embedded" : ""}`}
      style={
        { "--site-accent": content.brand.primaryColor } as React.CSSProperties
      }
    >
      {preview && !embedded && (
        <div className="preview-banner">
          <Link href="/?view=templates">
            آرالند <span> / پیش‌نمایش قالب</span>
          </Link>
          <span>این یک سایت نمونه است؛ محتوا قابل تغییر است.</span>
          <Link href={`/login?template=${site.templateId}`}>
            ساخت سایت با این قالب <ArrowUpLeft size={16} />
          </Link>
        </div>
      )}
      <a className="landing-skip" href="#site-main">رفتن به محتوای اصلی</a>
      <PublicSiteHeader
        site={site}
        content={content}
        siteBasePath={siteBasePath}
        pageId={page?.id}
        hasPosts={posts.length > 0}
        onNavigate={navigatePreview}
      />
      {page && (
        <div className="landing-page-intro">
          <nav className="landing-breadcrumb" aria-label="مسیر صفحه">
            <a href={links.homeHref} onClick={navigatePreview}>صفحهٔ اصلی</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{page.title}</span>
          </nav>
          {preview && !page.enabled && <p className="landing-page-status">این صفحه غیرفعال است و پس از انتشار نمایش داده نمی‌شود.</p>}
          {!sections.some((section) => section.type === "hero") && <h1>{page.title}</h1>}
        </div>
      )}
      <main id="site-main" tabIndex={-1} onClick={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a") : null;
        if (anchor) navigatePreview(event, anchor);
      }}>
      {sections.map((section) => (
        <LandingSection
          key={section.id}
          section={section}
          site={site}
          content={content}
          siteBasePath={siteBasePath}
          anchors={anchors}
          resolveLink={resolveLink}
          forms={forms}
          posts={posts}
          preview={preview}
          onStory={setStory}
        />
      ))}
      </main>
      <PublicSiteFooter
        site={site}
        content={content}
        siteBasePath={siteBasePath}
        pageId={page?.id}
        hasPosts={posts.length > 0}
        preview={preview}
        onNavigate={navigatePreview}
      />
      {story && (
        <StoryDialog
          item={story}
          href={story.url || story.pageId ? resolveLink(story.url, story.pageId) : undefined}
          onNavigate={navigatePreview}
          onClose={() => setStory(null)}
        />
      )}
    </div>
  );
}
function LandingSection({
  section: s,
  site,
  content,
  siteBasePath,
  anchors,
  resolveLink,
  forms,
  posts,
  preview,
  onStory,
}: {
  section: Section;
  site: Site;
  content: SiteContent;
  siteBasePath: string;
  anchors: Partial<Record<SectionType, string>>;
  resolveLink: (url?: string, pageId?: string) => string;
  forms: SiteForm[];
  posts: Post[];
  preview: boolean;
  onStory: (item: SectionItem) => void;
}) {
  if (s.type === "hero" && (site.templateId === "pulse" || site.templateId === "luma"))
    return <NicheHero section={s} content={content} template={site.templateId} href={resolveLink(s.buttonUrl, s.buttonPageId)} servicesHref={anchors.services} />;
  if (s.type === "hero")
    return (
      <section className={`landing-hero ${!s.image ? "landing-hero-text-only" : ""}`} id={s.id}>
        <div className="hero-copy">
          <div className="landing-eyebrow">
            <span />
            {site.templateId === "orbit"
              ? "ARCHITECTURE WITH A HUMAN TOUCH"
              : site.templateId === "bloom"
                ? "A LITTLE TIME, JUST FOR YOU"
                : "YOUR NEXT CHAPTER STARTS HERE"}
          </div>
          <h1>
            {s.title.split("\n").map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </h1>
          <div className="hero-description">
            {s.subtitle && <p>{s.subtitle}</p>}
            {s.buttonText?.trim() && (
              <a className="landing-button" href={resolveLink(s.buttonUrl, s.buttonPageId)}>
                {s.buttonText}
                <ArrowUpLeft size={21} />
              </a>
            )}
          </div>
          {site.templateId === "forma" && preview && site.id === "demo" && (
            <div className="hero-proof">
              <div className="avatar-stack">
                <img src="https://i.pravatar.cc/80?img=47" alt="" />
                <img src="https://i.pravatar.cc/80?img=12" alt="" />
                <img src="https://i.pravatar.cc/80?img=44" alt="" />
              </div>
              <span>
                یادگیری، کنار آدم‌های شبیه تو
                <br />
                <b>پروژه واقعی · همراهی حرفه‌ای</b>
              </span>
            </div>
          )}
        </div>
        {s.image && <div className="hero-photo">
          <img src={s.image} alt={s.title.replace("\n", " ")} />
          <span className="hero-stamp">
            {site.templateId === "bloom"
              ? "به خودت برگرد"
              : site.templateId === "forma"
                ? "LEARN. CREATE. GROW."
                : "DESIGNED TO FEEL LIKE YOU"}
            <MoveUpRight />
          </span>
        </div>}
        <div className="hero-bottom">
          <span>{content.brand.tagline}</span>
          {anchors.services && (
            <a href={anchors.services}>برای کشف بیشتر اسکرول کنید ↓</a>
          )}
          <span>{content.brand.name}</span>
        </div>
      </section>
    );
  if (s.type === "stories")
    return s.items?.length ? (
      <section className="landing-stories" id={s.id}>
        <span>
          {s.title}
          <small>لحظه‌های کوچک، داستان‌های تازه</small>
        </span>
        <div>
          {s.items?.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-label={`دیدن استوری ${item.title}`}
              aria-haspopup="dialog"
              onClick={() => onStory(item)}
            >
              <span>
                {item.image && <img src={item.image} alt="" loading="lazy" />}
                <Play size={14} />
              </span>
              <b>{item.title}</b>
            </button>
          ))}
        </div>
      </section>
    ) : null;
  if (s.type === "services")
    return (
      <section className="landing-section landing-services" id={s.id}>
        <div className="landing-section-title">
          <div>
            <span className="landing-eyebrow">
              {site.templateId === "forma"
                ? "01 / YOUR LEARNING PATH"
                : "01 / WHAT WE DO"}
            </span>
            <h2>{s.title}</h2>
            <p>{s.subtitle}</p>
          </div>
          {anchors.contact && (
            <a href={anchors.contact}>
              همه‌چیز از یک گفتگو شروع می‌شود <ArrowUpLeft size={22} />
            </a>
          )}
        </div>
        <div className="services-grid">
          {s.items?.map((item, i) => (
            <a
              key={item.id}
              className="service-card"
              href={resolveLink(item.url, item.pageId)}
            >
              <div className="service-image">
                {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
                <span>0{i + 1}</span>
                <i>
                  <ArrowUpLeft size={24} />
                </i>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </a>
          ))}
        </div>
      </section>
    );
  if (s.type === "about")
    return (
      <section className={`landing-section landing-about ${!s.image ? "landing-about-text-only" : ""}`} id={s.id}>
        {s.image && <div className="about-image">
          <img src={s.image} alt={s.title} loading="lazy" />
          <span className="about-star">✳</span>
        </div>}
        <div>
          <span className="landing-eyebrow">02 / OUR STORY</span>
          <h2>{s.title}</h2>
          <p>{s.subtitle}</p>
          <a className="landing-button" href={resolveLink(s.buttonUrl, s.buttonPageId)}>
            {s.buttonText || "بیشتر با هم آشنا شویم"} <ArrowUpLeft size={20} />
          </a>
          <div className="about-values">
            <span>
              نگاه تازه<small>به نیازهای شما</small>
            </span>
            <span>
              تجربه شخصی<small>در هر قدم مسیر</small>
            </span>
            <span>
              همراهی واقعی<small>از ابتدا تا نتیجه</small>
            </span>
          </div>
        </div>
      </section>
    );
  if (s.type === "testimonials")
    return (
      <section className="landing-section landing-quotes" id={s.id}>
        <div className="landing-section-title">
          <h2>{s.title}</h2>
          <span className="landing-eyebrow">GOOD WORDS, REAL PEOPLE</span>
        </div>
        <div>
          {s.items?.map((item, i) => (
            <figure key={item.id}>
              <span className="quote-mark">“</span>
              <blockquote>{item.description}</blockquote>
              <figcaption>
                <span className="quote-avatar">{item.title[0]}</span>
                <div>
                  {item.title}
                  <small>
                    {preview && site.id === "demo"
                      ? "محتوای نمونه قالب"
                      : "همراه ما"}
                  </small>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  if (s.type === "faq")
    return (
      <section className="landing-section landing-faq" id={s.id}>
        <div>
          <span className="landing-eyebrow">A FEW THINGS TO KNOW</span>
          <h2>{s.title}</h2>
          <p>برای سوال‌های بیشتر، با ما در ارتباط باشید.</p>
        </div>
        <div>
          {s.items?.map((item) => (
            <details key={item.id}>
              <summary>
                {item.title}
                <Plus size={20} />
              </summary>
              <p>{item.description}</p>
            </details>
          ))}
        </div>
      </section>
    );
  if (s.type === "instagram")
    return (
      <section className="landing-section" id={s.id}>
        <div className="landing-section-title">
          <h2>{s.title}</h2>
          <Instagram />
          <p>{s.subtitle}</p>
        </div>
        <div className="instagram-grid">
          {s.items?.map((item) => (
            <a
              key={item.id}
              href={resolveLink(item.url, item.pageId)}
              target="_blank"
              rel="noreferrer"
            >
              {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
              <span>
                {item.title} <ArrowUpLeft size={20} />
              </span>
            </a>
          ))}
        </div>
        {!s.items?.length && preview && (
          <p>تصاویر و پیوند پست‌های انتخابی اینجا قرار می‌گیرند.</p>
        )}
      </section>
    );
  if (s.type === "blog") {
    const items = posts.length ? posts : s.items || [];
    return items.length ? (
      <section className="landing-section" id={s.id}>
        <div className="landing-section-title">
          <h2>{s.title}</h2>
          <span className="landing-eyebrow">STORIES & INSIGHTS</span>
        </div>
        <div className="blog-grid">
          {items.map((item) => (
            <Link
              key={item.id}
              target={preview ? "_blank" : undefined}
              rel={preview ? "noopener noreferrer" : undefined}
              onClick={
                preview && site.status !== "PUBLISHED"
                  ? (event) => event.preventDefault()
                  : undefined
              }
              aria-label={
                preview && site.status !== "PUBLISHED"
                  ? `${item.title}؛ پس از انتشار سایت قابل مشاهده است`
                  : undefined
              }
              href={
                "slug" in item
                  ? `${siteBasePath}/blog/${item.slug}`
                  : resolveLink(item.url, item.pageId)
              }
            >
              {("cover" in item
                ? item.cover
                : "image" in item
                  ? item.image
                  : undefined) && (
                <img
                  src={
                    "cover" in item
                      ? item.cover
                      : "image" in item
                        ? item.image
                        : undefined
                  }
                  alt={item.title}
                />
              )}
              <h3>{item.title}</h3>
              <p>
                {"excerpt" in item
                  ? item.excerpt
                  : "description" in item
                    ? item.description
                    : ""}
              </p>
              <span>
                ادامه مطلب <ArrowLeft size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    ) : null;
  }
  if (s.type === "contact")
    return (
      <section className="landing-section landing-contact" id={s.id}>
        <div>
          <span className="landing-eyebrow">LET’S MAKE SOMETHING GOOD</span>
          <h2>{s.title}</h2>
          <p>{s.subtitle}</p>
          <span className="contact-decoration">↖</span>
        </div>
        <ContactForm
          key={`${site.id}-${s.id}-${forms.map((form) => form.id).join("-")}`}
          forms={forms}
          site={site}
          preview={preview}
          buttonText={s.buttonText}
        />
      </section>
    );
  return null;
}
function StoryDialog({
  item,
  href,
  onNavigate,
  onClose,
}: {
  item: SectionItem;
  href?: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLAnchorElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="story-modal"
      aria-labelledby={titleId}
      aria-describedby={item.description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const first = closeButton.current;
        const last = actionRef.current || first;
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="story-content">
        <div className="story-progress" aria-hidden="true" />
        <button
          ref={closeButton}
          type="button"
          aria-label="بستن استوری"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        {item.image && <img src={item.image} alt="" />}
        <div>
          <h2 id={titleId}>{item.title}</h2>
          {item.description && <p id={descriptionId}>{item.description}</p>}
          {href && (
            <a
              ref={actionRef}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              onClick={(event) => {
                onNavigate?.(event);
                if (href.startsWith("#")) onClose();
              }}
            >
              بیشتر ببینید <ArrowUpLeft size={18} />
            </a>
          )}
        </div>
      </div>
    </dialog>
  );
}
function ContactForm({
  forms,
  site,
  preview,
  buttonText,
}: {
  forms: SiteForm[];
  site: Site;
  preview: boolean;
  buttonText?: string;
}) {
  const [formIndex, setFormIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const form = forms[formIndex] ||
    forms[0] || {
      id: "demo",
      title: "درخواست مشاوره",
      fields: [
        {
          id: "name",
          label: "نام و نام خانوادگی",
          type: "text",
          required: true,
        },
        { id: "phone", label: "شماره موبایل", type: "phone", required: true },
        {
          id: "message",
          label: "از چیزی که در ذهن دارید بگویید",
          type: "textarea",
          required: false,
        },
      ],
    };
  if (!forms.length && site.id !== "demo")
    return (
      <div className="contact-form">
        <p>
          {preview
            ? "فرمی برای نمایش موجود نیست. فرم را از بخش فرم‌ها بساز و پیش‌نمایش را به‌روزرسانی کن."
            : "فرم ارتباط در حال حاضر در دسترس نیست."}
        </p>
      </div>
    );
  return (
    <form
      className="contact-form"
      key={form.id}
      onChange={() => { setMessage(""); setError(""); }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (inFlight.current) return;
        setError("");
        setMessage("");
        if (preview) {
          setMessage(
            "این فرم پیش‌نمایش است و پاسخی ثبت نمی‌کند. ثبت واقعی پس از انتشار، در سایت عمومی انجام می‌شود.",
          );
          return;
        }
        if (!forms.length) {
          setError("فرم این سایت هنوز فعال نشده است.");
          return;
        }
        setBusy(true);
        inFlight.current = true;
        const element = e.currentTarget;
        try {
          await request(
            `/public/sites/${site.slug}/forms/${form.id}/submit`,
            json({ values: Object.fromEntries(new FormData(element)) }),
          );
          setMessage("پیام شما ثبت شد. به‌زودی با شما در ارتباط خواهیم بود.");
          element.reset();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          inFlight.current = false;
          setBusy(false);
        }
      }}
    >
      {forms.length > 1 && (
        <label>
          موضوع درخواست
          <select
            value={formIndex}
            disabled={busy}
            onChange={(e) => { setFormIndex(Number(e.target.value)); setMessage(""); setError(""); }}
          >
            {forms.map((f, i) => (
              <option key={f.id} value={i}>
                {f.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {form.fields.map((field) => (
        <label key={field.id}>
          {field.label}
          {field.required && <span> *</span>}
          {field.type === "textarea" ? (
            <textarea
              name={field.id}
              required={field.required}
              placeholder="اینجا بنویسید…"
              rows={3}
              maxLength={5000}
              disabled={busy}
            />
          ) : field.type === "select" ? (
            <select name={field.id} required={field.required} disabled={busy}>
              <option value="">انتخاب کنید</option>
              {("options" in field ? field.options : [])?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "phone" ? "tel" : field.type}
              name={field.id}
              required={field.required}
              maxLength={field.type === "phone" ? 30 : 5000}
              disabled={busy}
              autoComplete={field.type === "phone" ? "tel" : field.type === "email" ? "email" : undefined}
              dir={field.type === "phone" || field.type === "email" ? "ltr" : undefined}
              placeholder={
                field.type === "phone" ? "۰۹۱۲ ۰۰۰ ۰۰۰۰" : field.label
              }
            />
          )}
        </label>
      ))}
      <button className="landing-button" disabled={busy}>
        {busy ? "در حال ارسال…" : buttonText || "ارسال درخواست"}
        <ArrowUpLeft size={21} />
      </button>
      <small>اطلاعات شما فقط برای پاسخ به درخواستتان استفاده می‌شود.</small>
      <Notice message={message} />
      <Notice message={error} error />
    </form>
  );
}

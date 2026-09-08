import { ArrowDown, ArrowUpLeft } from "lucide-react";
import type { TemplateSectionProps } from "./types";

const folioNumber = (index: number) =>
  String(index + 1).padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function DraftingMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="24" stroke="currentColor" />
      <path d="M36 0v72M0 36h72M12 12l48 48M12 60l48-48" stroke="currentColor" />
      <circle cx="36" cy="36" r="5" fill="currentColor" />
    </svg>
  );
}

function OrbitNotes({ section, resolveLink }: TemplateSectionProps) {
  if (!section.items?.length) return null;
  return (
    <div className="orbit-notes">
      {section.items.map((item, index) => (
        <a className="orbit-note" href={resolveLink(item.url, item.pageId)} key={item.id}>
          <span className="orbit-folio" aria-hidden="true">{folioNumber(index)}</span>
          {item.image && <img src={item.image} alt="" loading="lazy" />}
          <div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
          <ArrowUpLeft size={20} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function OrbitSection(props: TemplateSectionProps) {
  const { section: s, content, anchors, resolveLink } = props;
  if (s.type === "hero") {
    return (
      <section className={`template-section orbit-cover ${s.image ? "" : "orbit-cover-without-image"}`} id={s.id}>
        <div className="orbit-cover-heading">
          <div className="orbit-running-head"><span>{content.brand.tagline}</span><DraftingMark /></div>
          <h1>{s.title.split("\n").map((line, index) => <span key={index}>{line}</span>)}</h1>
          <div className="orbit-cover-intro">
            <div className="orbit-cover-actions">
              {s.buttonText?.trim() && <a className="landing-button orbit-action" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={22} aria-hidden="true" /></a>}
              {anchors.services && <a className="orbit-scroll" href={anchors.services}><ArrowDown size={18} aria-hidden="true" /><span>کشف خدمات</span></a>}
            </div>
            {s.subtitle && <p>{s.subtitle}</p>}
          </div>
        </div>
        {s.image && (
          <figure className="orbit-cover-image">
            <div className="orbit-image-frame"><img src={s.image} alt={s.title.replaceAll("\n", " ")} fetchPriority="high" /></div>
            <figcaption><span>{content.brand.name}</span><span className="orbit-dimension" aria-hidden="true" /><span>{content.brand.tagline}</span></figcaption>
          </figure>
        )}
        <OrbitNotes {...props} />
      </section>
    );
  }
  if (s.type === "services") {
    return (
      <section className="template-section orbit-portfolio" id={s.id}>
        <header className="orbit-portfolio-heading">
          <span className="orbit-section-label"><span aria-hidden="true">+</span> خدمات ما</span>
          <div><h2>{s.title}</h2>{s.subtitle && <p>{s.subtitle}</p>}</div>
          {s.buttonText?.trim() ? <a className="orbit-text-link" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={20} aria-hidden="true" /></a> : anchors.contact && <a className="orbit-text-link" href={anchors.contact}>در ارتباط باشیم<ArrowUpLeft size={20} aria-hidden="true" /></a>}
        </header>
        {!!s.items?.length && <div className={`orbit-project-index ${s.items.length === 1 ? "orbit-project-index-single" : ""}`}>
          {s.items.map((item, index) => (
            <a className="orbit-project" key={item.id} href={resolveLink(item.url, item.pageId)}>
              <div className={`orbit-project-media ${item.image ? "" : "orbit-project-media-empty"}`}>
                {item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : <DraftingMark />}
                <span className="orbit-project-number" aria-hidden="true">{folioNumber(index)}</span>
                <span className="orbit-project-arrow"><ArrowUpLeft size={24} aria-hidden="true" /></span>
              </div>
              <div className="orbit-project-caption"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
            </a>
          ))}
        </div>}
        {s.image && <figure className="orbit-portfolio-image"><img src={s.image} alt={s.title} loading="lazy" /></figure>}
      </section>
    );
  }
  if (s.type === "about") {
    return (
      <section className={`template-section orbit-manifesto ${s.image ? "" : "orbit-manifesto-without-image"}`} id={s.id}>
        <div className="orbit-manifesto-heading"><span className="orbit-section-label"><span aria-hidden="true">+</span> درباره ما</span><h2>{s.title}</h2></div>
        <div className="orbit-manifesto-composition">
          {s.image && <figure className="orbit-manifesto-image"><img src={s.image} alt={s.title} loading="lazy" /><figcaption><span>{content.brand.name}</span><span aria-hidden="true">↖</span></figcaption></figure>}
          <div className="orbit-manifesto-copy">
            <DraftingMark className="orbit-manifesto-mark" />
            {s.subtitle && <p>{s.subtitle}</p>}
            {s.buttonText?.trim() && <a className="orbit-text-link" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={22} aria-hidden="true" /></a>}
            <span className="orbit-signature">{content.brand.name}<small>{content.brand.tagline}</small></span>
          </div>
        </div>
        <OrbitNotes {...props} />
      </section>
    );
  }
  return null;
}

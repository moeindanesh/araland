import { ArrowDown, ArrowUpLeft } from "lucide-react";
import type { TemplateSectionProps } from "./types";

const ritualNumber = (index: number) =>
  String(index + 1).padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function BloomFlower({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="92" height="92" viewBox="0 0 92 92" fill="none" aria-hidden="true">
      <path d="M46 46C18 39 13 7 31 8c13 1 15 25 15 38Zm0 0C53 18 85 13 84 31 83 44 59 46 46 46Zm0 0c28 7 33 39 15 38-13-1-15-25-15-38Zm0 0C39 74 7 79 8 61 9 48 33 46 46 46Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="46" cy="46" r="4" fill="currentColor" />
    </svg>
  );
}

function BloomNotes({ section, resolveLink }: TemplateSectionProps) {
  if (!section.items?.length) return null;
  return (
    <div className="bloom-notes">
      {section.items.map((item) => (
        <a className="bloom-note" href={resolveLink(item.url, item.pageId)} key={item.id}>
          {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="bloom-note-petal" aria-hidden="true" />}
          <div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
          <ArrowUpLeft size={18} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function BloomSection(props: TemplateSectionProps) {
  const { section: s, content, anchors, resolveLink } = props;
  if (s.type === "hero") {
    return (
      <section className={`template-section bloom-ritual ${s.image ? "" : "bloom-ritual-without-image"}`} id={s.id}>
        <div className="bloom-ritual-heading">
          <span className="bloom-whisper">{content.brand.tagline}</span>
          <h1>{s.title.split("\n").map((line, index) => <span key={index}>{line}</span>)}</h1>
          {s.subtitle && <p>{s.subtitle}</p>}
        </div>
        {s.image && <div className="bloom-ritual-scene">
          <figure className="bloom-ritual-photo"><img src={s.image} alt={s.title.replaceAll("\n", " ")} fetchPriority="high" /></figure>
          <BloomFlower className="bloom-ritual-flower" />
          <span className="bloom-ritual-signature">{content.brand.name}</span>
          <span className="bloom-ritual-seed" aria-hidden="true" />
        </div>}
        <div className="bloom-ritual-actions">
          {s.buttonText?.trim() && <a className="landing-button bloom-action" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={20} aria-hidden="true" /></a>}
          {anchors.services && <a className="bloom-discover" href={anchors.services}>کشف خدمات<ArrowDown size={17} aria-hidden="true" /></a>}
        </div>
        <BloomNotes {...props} />
      </section>
    );
  }
  if (s.type === "services") {
    return (
      <section className="template-section bloom-care" id={s.id}>
        <header className="bloom-care-heading"><BloomFlower /><span className="bloom-whisper">خدمات ما</span><h2>{s.title}</h2>{s.subtitle && <p>{s.subtitle}</p>}</header>
        {!!s.items?.length && <div className="bloom-treatment-menu">
          {s.items.map((item, index) => (
            <a className="bloom-treatment" href={resolveLink(item.url, item.pageId)} key={item.id}>
              <span className="bloom-treatment-number" aria-hidden="true">{ritualNumber(index)}</span>
              <div className="bloom-treatment-copy"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<span className="bloom-treatment-link">بیشتر ببینید<ArrowUpLeft size={18} aria-hidden="true" /></span></div>
              <div className={`bloom-treatment-image ${item.image ? "" : "bloom-treatment-image-empty"}`}>{item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : <BloomFlower />}</div>
            </a>
          ))}
        </div>}
        {s.image && <figure className="bloom-care-image"><img src={s.image} alt={s.title} loading="lazy" /></figure>}
        {s.buttonText?.trim() && <div className="bloom-care-action"><a className="landing-button bloom-action" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={20} aria-hidden="true" /></a></div>}
      </section>
    );
  }
  if (s.type === "about") {
    return (
      <section className={`template-section bloom-sanctuary ${s.image ? "" : "bloom-sanctuary-without-image"}`} id={s.id}>
        <div className="bloom-sanctuary-inner">
          <div className="bloom-sanctuary-copy"><span className="bloom-whisper">درباره ما</span><h2>{s.title}</h2>{s.subtitle && <p>{s.subtitle}</p>}{s.buttonText?.trim() && <a className="landing-button bloom-action" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={20} aria-hidden="true" /></a>}<span className="bloom-sanctuary-signature">{content.brand.name}</span></div>
          {s.image && <figure className="bloom-sanctuary-image"><div><img src={s.image} alt={s.title} loading="lazy" /></div><BloomFlower /><figcaption>{content.brand.tagline}</figcaption></figure>}
        </div>
        <BloomNotes {...props} />
      </section>
    );
  }
  return null;
}

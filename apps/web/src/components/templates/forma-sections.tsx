import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, BookOpen, Sparkles } from "lucide-react";
import type { SectionItem } from "@araland/shared";
import type { TemplateSectionProps } from "./types";

const number = (index: number) =>
  (index + 1).toString().padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function FormaMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 4v92M4 50h92M17.5 17.5l65 65M17.5 82.5l65-65" stroke="currentColor" strokeWidth="13" />
      <circle cx="50" cy="50" r="13" fill="currentColor" />
    </svg>
  );
}

function ItemContent({ item, index }: { item: SectionItem; index: number }) {
  return (
    <>
      <span className="forma-syllabus-number" aria-hidden="true">{number(index)}</span>
      <div className="forma-syllabus-copy">
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
      {item.image && <img className="forma-syllabus-image" src={item.image} alt="" loading="lazy" />}
    </>
  );
}

export function FormaSection({ section: s, content, anchors, resolveLink }: TemplateSectionProps) {
  if (s.type === "hero") {
    return (
      <section className="template-section forma-workbook" id={s.id}>
        <div className="forma-workbook-topline">
          <span><BookOpen size={17} aria-hidden="true" />{content.brand.tagline}</span>
          <span>{content.brand.name}</span>
        </div>
        <div className="forma-workbook-heading">
          <span className="forma-workbook-sticker" aria-hidden="true"><FormaMark /></span>
          <h1>{s.title.split("\n").map((line, index) => <span key={index}>{line}</span>)}</h1>
          <span className="forma-workbook-arrow" aria-hidden="true"><ArrowDownLeft /></span>
        </div>
        <div className={`forma-study-board ${!s.image ? "forma-study-board-without-image" : ""}`}>
          <div className="forma-study-note">
            <span className="forma-note-corner" aria-hidden="true" />
            <BookOpen className="forma-note-icon" size={28} aria-hidden="true" />
            {s.subtitle && <p>{s.subtitle}</p>}
            {s.buttonText?.trim() && (
              <a className="forma-action" href={resolveLink(s.buttonUrl, s.buttonPageId)}>
                {s.buttonText}<ArrowUpLeft size={21} aria-hidden="true" />
              </a>
            )}
          </div>
          {s.image && (
            <figure className="forma-study-photo">
              <img src={s.image} alt={s.title.replace(/\n/g, " ")} />
              <span className="forma-photo-tape" aria-hidden="true" />
            </figure>
          )}
          <div className="forma-study-tab">
            <FormaMark />
            <span>{content.brand.name}</span>
            {anchors.services && (
              <a href={anchors.services}>مسیرهای یادگیری<ArrowLeft size={21} aria-hidden="true" /></a>
            )}
          </div>
        </div>
        {!!s.items?.length && (
          <ul className="forma-workbook-notes">
            {s.items.map((item) => (
              <li key={item.id}>
                {item.image && <img src={item.image} alt="" loading="lazy" />}
                <div>
                  {item.url || item.pageId ? <a href={resolveLink(item.url, item.pageId)}>{item.title}<ArrowUpLeft size={17} aria-hidden="true" /></a> : <b>{item.title}</b>}
                  {item.description && <p>{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (s.type === "services") {
    return (
      <section className="template-section forma-syllabus" id={s.id}>
        <header className="forma-syllabus-heading">
          <div>
            <span className="forma-section-label"><BookOpen size={17} aria-hidden="true" />مسیرهای یادگیری</span>
            <h2>{s.title}</h2>
          </div>
          <div className="forma-syllabus-intro">
            {s.subtitle && <p>{s.subtitle}</p>}
            {s.buttonText?.trim() && <a className="forma-text-link" href={resolveLink(s.buttonUrl, s.buttonPageId)}>{s.buttonText}<ArrowUpLeft size={20} aria-hidden="true" /></a>}
          </div>
        </header>
        {s.image && <img className="forma-syllabus-cover" src={s.image} alt="" loading="lazy" />}
        {!!s.items?.length && (
          <ol className="forma-syllabus-list">
            {s.items.map((item, index) => (
              <li key={item.id}>
                <a className="forma-syllabus-row" href={resolveLink(item.url, item.pageId)}>
                  <ItemContent item={item} index={index} />
                  <span className="forma-syllabus-arrow"><ArrowUpLeft size={25} aria-hidden="true" /></span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  if (s.type === "about") {
    return (
      <section className="template-section forma-collective" id={s.id}>
        <div className={`forma-collective-panel ${!s.image ? "forma-collective-without-image" : ""}`}>
          <div className="forma-collective-copy">
            <span className="forma-section-label"><Sparkles size={17} aria-hidden="true" />دربارهٔ {content.brand.name}</span>
            <h2>{s.title}</h2>
            {s.subtitle && <p>{s.subtitle}</p>}
            {(s.buttonText?.trim() || anchors.contact) && (
              <a className="forma-action forma-action-light" href={s.buttonText?.trim() ? resolveLink(s.buttonUrl, s.buttonPageId) : anchors.contact}>
                {s.buttonText?.trim() || "گفتگو دربارهٔ مسیر تو"}<ArrowUpLeft size={21} aria-hidden="true" />
              </a>
            )}
          </div>
          {s.image && (
            <figure className="forma-collective-photo">
              <img src={s.image} alt={s.title} loading="lazy" />
              <figcaption><span>{content.brand.name}</span><FormaMark /></figcaption>
            </figure>
          )}
          {!!s.items?.length && (
            <ol className="forma-collective-steps">
              {s.items.map((item, index) => (
                <li key={item.id}>
                  <span className="forma-collective-node" aria-hidden="true">{number(index)}</span>
                  {item.image && <img src={item.image} alt="" loading="lazy" />}
                  <div>
                    <h3>{item.url || item.pageId ? <a href={resolveLink(item.url, item.pageId)}>{item.title}<ArrowUpLeft size={17} aria-hidden="true" /></a> : item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="forma-collective-footer"><span>{content.brand.tagline}</span><span className="forma-connected-line" aria-hidden="true"><i /><i /><i /></span><BookOpen size={25} aria-hidden="true" /></div>
        </div>
      </section>
    );
  }
  return null;
}

import { ArrowDownLeft, ArrowLeft, ArrowUpLeft } from "lucide-react";
import type { SectionItem } from "@araland/shared";
import type { TemplateSectionProps } from "./types";

const ordinal = (index: number) => String(index + 1).padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function PulseNotes({ items, resolveLink }: Pick<TemplateSectionProps, "resolveLink"> & { items?: SectionItem[] }) {
  if (!items?.length) return null;
  return <div className="pulse-notes">{items.map((item, index) => <article key={item.id}>
    <span className="pulse-note-number" aria-hidden="true">{ordinal(index)}</span>
    {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
    <div><h3>{item.url || item.pageId ? <a href={resolveLink(item.url, item.pageId)}>{item.title}<ArrowUpLeft size={18} aria-hidden="true" /></a> : item.title}</h3>{item.description && <p>{item.description}</p>}</div>
  </article>)}</div>;
}

function PulseButton({ section, resolveLink }: Pick<TemplateSectionProps, "section" | "resolveLink">) {
  return section.buttonText ? <a className="pulse-action" href={resolveLink(section.buttonUrl, section.buttonPageId)}><span>{section.buttonText}</span><ArrowUpLeft size={22} aria-hidden="true" /></a> : null;
}

export function PulseSection({ section: s, content, anchors, resolveLink }: TemplateSectionProps) {
  if (s.type === "hero") return <section id={s.id} className={`template-section pulse-stage ${!s.image ? "pulse-stage-text" : ""}`}>
    <div className="pulse-stage-frame">
      {s.image && <div className="pulse-stage-image"><img src={s.image} alt={s.title.replace(/\n/g, " ")} fetchPriority="high" /></div>}
      <div className="pulse-stage-shade" aria-hidden="true" />
      <div className="pulse-stage-content">
        <p className="pulse-kicker"><span aria-hidden="true" />{content.brand.tagline}</p>
        <h1>{s.title.split("\n").map((line, index) => <span key={index}>{line}</span>)}</h1>
        {s.subtitle && <p className="pulse-stage-intro">{s.subtitle}</p>}
        <div className="pulse-stage-actions"><PulseButton section={s} resolveLink={resolveLink} />{anchors.services && <a className="pulse-text-link" href={anchors.services}>برنامه‌های تمرین<ArrowDownLeft size={20} aria-hidden="true" /></a>}</div>
      </div>
      <div className="pulse-track-mark" aria-hidden="true"><i /><i /><i /></div>
    </div>
    <div className="pulse-stage-baseline"><span>{content.brand.name}</span><div className="pulse-baseline-track" aria-hidden="true"><i /><i /><i /></div>{anchors.about && <a href={anchors.about}>با ما آشنا شو<ArrowLeft size={20} aria-hidden="true" /></a>}</div>
    <PulseNotes items={s.items} resolveLink={resolveLink} />
  </section>;

  if (s.type === "services") return <section id={s.id} className="template-section pulse-programs">
    <div className="pulse-programs-heading"><div><p className="pulse-kicker"><span aria-hidden="true" />برنامه‌ها</p><h2>{s.title}</h2></div>{s.subtitle && <p>{s.subtitle}</p>}</div>
    {s.image && <img className="pulse-programs-cover" src={s.image} alt={s.title} loading="lazy" />}
    {!!s.items?.length && <div className="pulse-lanes">{s.items.map((item, index) => {
      const body = <><span className="pulse-lane-number" aria-hidden="true">{ordinal(index)}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.image && <div className="pulse-lane-image"><img src={item.image} alt={item.title} loading="lazy" /></div>}<span className="pulse-lane-arrow"><ArrowUpLeft size={26} aria-hidden="true" /></span></>;
      const className = `pulse-lane ${!item.image ? "pulse-lane-no-image" : ""} ${!item.description ? "pulse-lane-no-description" : ""}`;
      return <a key={item.id} className={className} href={resolveLink(item.url, item.pageId)}>{body}</a>;
    })}</div>}
    {s.buttonText && <div className="pulse-programs-action"><PulseButton section={s} resolveLink={resolveLink} /></div>}
  </section>;

  if (s.type === "about") return <section id={s.id} className={`template-section pulse-manifesto ${!s.image ? "pulse-manifesto-text" : ""}`}>
    <div className="pulse-manifesto-inner"><p className="pulse-kicker"><span aria-hidden="true" />درباره ما</p><h2>{s.title}</h2>
      <div className="pulse-manifesto-body">
        {s.image && <figure className="pulse-manifesto-image"><img src={s.image} alt={s.title.replace(/\n/g, " ")} loading="lazy" /><span aria-hidden="true"><i /><i /><i /></span></figure>}
        <div className="pulse-manifesto-copy"><div className="pulse-manifesto-rule" aria-hidden="true" />{s.subtitle && <p>{s.subtitle}</p>}<PulseNotes items={s.items} resolveLink={resolveLink} /><PulseButton section={s} resolveLink={resolveLink} /></div>
      </div>
    </div>
  </section>;
  return null;
}

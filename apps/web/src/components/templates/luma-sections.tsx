import { ArrowLeft, ArrowUpLeft, Plus } from "lucide-react";
import type { SectionItem } from "@araland/shared";
import type { TemplateSectionProps } from "./types";

const ordinal = (index: number) => String(index + 1).padStart(2, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function LumaButton({ section, resolveLink }: Pick<TemplateSectionProps, "section" | "resolveLink">) {
  return section.buttonText ? <a className="luma-action" href={resolveLink(section.buttonUrl, section.buttonPageId)}><span>{section.buttonText}</span><ArrowLeft size={19} aria-hidden="true" /></a> : null;
}

function LumaNotes({ items, resolveLink }: Pick<TemplateSectionProps, "resolveLink"> & { items?: SectionItem[] }) {
  if (!items?.length) return null;
  return <div className="luma-notes">{items.map((item) => <article key={item.id}>
    {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
    <div><h3>{item.url || item.pageId ? <a href={resolveLink(item.url, item.pageId)}>{item.title}<ArrowUpLeft size={18} aria-hidden="true" /></a> : item.title}</h3>{item.description && <p>{item.description}</p>}</div>
  </article>)}</div>;
}

export function LumaSection({ section: s, content, anchors, resolveLink }: TemplateSectionProps) {
  if (s.type === "hero") return <section id={s.id} className={`template-section luma-welcome ${!s.image ? "luma-welcome-text" : ""}`}>
    <div className="luma-masthead"><p className="luma-overline"><span aria-hidden="true">+</span>{content.brand.tagline}</p><h1>{s.title}</h1></div>
    <div className="luma-welcome-body">
      <div className="luma-welcome-copy"><span className="luma-welcome-rule" aria-hidden="true" />{s.subtitle && <p>{s.subtitle}</p>}<LumaButton section={s} resolveLink={resolveLink} />{anchors.services && <a className="luma-directory-link" href={anchors.services}>آشنایی با خدمات<ArrowLeft size={17} aria-hidden="true" /></a>}<CareMark /></div>
      {s.image && <figure className="luma-welcome-image"><img src={s.image} alt={s.title.replace(/\n/g, " ")} fetchPriority="high" /><figcaption><Plus size={20} aria-hidden="true" /><span>{content.brand.name}</span></figcaption></figure>}
    </div>
    <LumaNotes items={s.items} resolveLink={resolveLink} />
  </section>;

  if (s.type === "services") return <section id={s.id} className="template-section luma-directory">
    <div className="luma-directory-inner"><div className="luma-directory-heading"><p className="luma-overline"><span aria-hidden="true">+</span>خدمات و مراقبت</p><h2>{s.title}</h2>{s.subtitle && <p className="luma-directory-intro">{s.subtitle}</p>}{s.image && <img className="luma-directory-cover" src={s.image} alt={s.title} loading="lazy" />}<LumaButton section={s} resolveLink={resolveLink} /></div>
      {!!s.items?.length && <div className="luma-directory-list">{s.items.map((item, index) => {
        const body = <><span className="luma-service-number" aria-hidden="true">{ordinal(index)}</span><div className="luma-service-copy"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>{item.image && <div className="luma-service-image"><img src={item.image} alt={item.title} loading="lazy" /></div>}<span className="luma-service-arrow"><ArrowUpLeft size={20} aria-hidden="true" /></span></>;
        const className = `luma-service ${!item.image ? "luma-service-no-image" : ""}`;
        return <a className={className} key={item.id} href={resolveLink(item.url, item.pageId)}>{body}</a>;
      })}</div>}
    </div>
  </section>;

  if (s.type === "about") return <section id={s.id} className={`template-section luma-conversation ${!s.image ? "luma-conversation-text" : ""}`}>
    <div className="luma-conversation-title"><p className="luma-overline"><span aria-hidden="true">+</span>آشنایی با ما</p><h2>{s.title}</h2><span className="luma-conversation-line" aria-hidden="true" /></div>
    <div className="luma-conversation-body">{s.image && <figure><img src={s.image} alt={s.title.replace(/\n/g, " ")} loading="lazy" /><div aria-hidden="true"><Plus size={28} /></div></figure>}<div className="luma-conversation-copy">{s.subtitle && <p>{s.subtitle}</p>}<LumaNotes items={s.items} resolveLink={resolveLink} /><LumaButton section={s} resolveLink={resolveLink} /></div></div>
  </section>;
  return null;
}

function CareMark() {
  return <div className="luma-care-mark" aria-hidden="true"><i /><i /><i /><i /></div>;
}

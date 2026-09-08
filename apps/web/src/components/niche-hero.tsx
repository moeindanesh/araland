import { ArrowDownLeft, ArrowUpLeft, Activity, Sparkles } from "lucide-react";
import type { Section, SiteContent } from "@araland/shared";

export function NicheHero({ section, content, template, href, servicesHref }: {
  section: Section;
  content: SiteContent;
  template: "pulse" | "luma";
  href: string;
  servicesHref?: string;
}) {
  const fitness = template === "pulse";
  return (
    <section id={section.id} className={`niche-hero ${!section.image ? "niche-hero-no-image" : ""}`}>
      <div className="niche-hero-copy">
        <div className="niche-kicker">
          <span aria-hidden="true">{fitness ? <Activity size={18} /> : <Sparkles size={17} />}</span>
          {content.brand.tagline}
        </div>
        <h1>{section.title.split("\n").map((line, i) => <span key={i}>{line}</span>)}</h1>
        {section.subtitle && <p>{section.subtitle}</p>}
        <div className="niche-hero-actions">
          {section.buttonText?.trim() && <a className="landing-button" href={href}>
            {section.buttonText}<ArrowUpLeft size={23} />
          </a>}
          {servicesHref && <a className="niche-secondary" href={servicesHref}>
            {fitness ? "مسیرت رو پیدا کن" : "آشنایی با خدمات"}<ArrowDownLeft size={18} />
          </a>}
        </div>
        <div className="niche-hero-footnote">
          <span className="niche-orbit" aria-hidden="true">{fitness ? "↗" : "✳"}</span>
          <span>{fitness ? "با هر نقطه شروعی،\nاین مسیر برای تو جا دارد." : "برای شناختن شما،\nبرای شنیدن شما."}</span>
        </div>
      </div>
      {section.image && <div className="niche-hero-visual">
        <div className="niche-hero-image">
          <img src={section.image} alt={fitness ? "حرکت و تمرین در فضای باز" : "تصویر مفهومی مراقبت و زیبایی طبیعی"} fetchPriority="high" width={fitness ? 1536 : 1024} height={fitness ? 1024 : 1536} />
        </div>
        <div className="niche-image-caption">
          <span>{fitness ? "حرکت کن. زندگی کن." : "زیبایی در خودِ شماست."}</span>
          <ArrowUpLeft aria-hidden="true" size={22} />
        </div>
        <span className="niche-wordmark" aria-hidden="true">{fitness ? "PULSE" : "luma"}</span>
        {!fitness && <span className="niche-vertical-note">مراقبت، با نگاه انسانی</span>}
      </div>}
      <div className="niche-hero-baseline">
        <span>{fitness ? "قدرت · تعادل · تندرستی" : "شناخت · گفتگو · مراقبت"}</span>
        {servicesHref && <a href={servicesHref}>{fitness ? "حرکت بعدی تو" : "کمی بیشتر آشنا شویم"}<ArrowDownLeft size={18} /></a>}
        <span aria-hidden="true" dir="ltr">{fitness ? "01 — KEEP MOVING" : "01 — THE ART OF CARE"}</span>
      </div>
    </section>
  );
}

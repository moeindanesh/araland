"use client";
import Link from "next/link";
import { ActionButton } from "./ui";
import { templates, TemplateId } from "@araland/shared";
import { ArrowUpLeft, ArrowLeft, MoveUpRight, Sparkles } from "lucide-react";
export function TemplatePreview({ id }: { id: TemplateId }) {
  const t = templates.find((t) => t.id === id)!;
  return (
    <div className={`template-art art-${id}`}>
      <div className="art-nav">
        <b>
          {t.englishName}
          <span>®</span>
        </b>
        <span>درباره ما　 خدمات　 ارتباط</span>
        <i>شروع کنیم ↗</i>
      </div>
      {id === "orbit" ? (
        <>
          <div className="orbit-art-title">
            فضا برای زندگی.
            <br />
            <span>طراحی برای ماندن.</span>
          </div>
          <div className="orbit-art-image">
            <img src={t.image} alt="فضای معماری گرم و مینیمال" />
            <span className="art-round">
              <MoveUpRight size={22} />
            </span>
          </div>
          <div className="art-caption">
            ما به تاثیر فضاها باور داریم.
            <span>Architecture & Interior Design</span>
          </div>
        </>
      ) : id === "bloom" ? (
        <div className="bloom-art-body">
          <div>
            <span className="art-small">A LITTLE TIME FOR YOU</span>
            <h3>
              زیبایی،
              <br />
              به آرامی
              <br />
              <em>شکوفا می‌شود.</em>
            </h3>
            <span className="art-pill">لحظه‌ای برای خودت ↖</span>
          </div>
          <div className="bloom-art-image">
            <img src={t.image} alt="فضای آرام مراقبت و تندرستی" />
            <span>✳</span>
          </div>
        </div>
      ) : id === "pulse" || id === "luma" ? (
        <div className="niche-art-body">
          <div>
            <span className="art-small">{id === "pulse" ? "با ریتم خودت" : "مراقبت، با نگاه انسانی"}</span>
            <h3>{id === "pulse" ? <>حال خوب،<br />از حرکت<br /><em>شروع می‌شه.</em></> : <>زیبایی،<br />با خیال<br /><em>آسوده.</em></>}</h3>
            <span className="art-pill">{id === "pulse" ? "قدم اول رو بردار" : "درخواست مشاوره"} ↖</span>
          </div>
          <div className="niche-art-image">
            <img src={t.image} alt={id === "pulse" ? "ورزش و حرکت در فضای باز" : "مراقبت و زیبایی طبیعی"} loading="lazy" />
            <span aria-hidden="true">{id === "pulse" ? "PULSE" : "luma"}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="forma-art-body">
            <span className="art-small">YOUR NEXT CHAPTER STARTS HERE</span>
            <h3>
              فردات رو
              <br />
              <span>از نو بساز.</span>
              <Sparkles size={36} />
            </h3>
            <p>مهارت‌های تازه. آدم‌های الهام‌بخش. فرصت‌های بزرگ.</p>
            <span className="art-pill">مسیرت رو پیدا کن ↖</span>
          </div>
          <div className="forma-art-bottom">
            <img src={t.image} alt="گروهی در حال یادگیری و همکاری" />
            <span>
              از یاد گرفتن
              <br />
              <b>تا تاثیر گذاشتن.</b>
            </span>
            <span className="art-round">
              <ArrowUpLeft />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
export function TemplateCard({
  id,
  onSelect,
  selected = false,
}: {
  id: TemplateId;
  onSelect?: (id: TemplateId) => void;
  selected?: boolean;
}) {
  const t = templates.find((t) => t.id === id)!;
  return (
    <article className="template-card">
      <Link href={`/preview/${id}`} aria-label={`پیش‌نمایش قالب ${t.name}`}>
        <TemplatePreview id={id} />
      </Link>
      <div className="template-meta">
        <div>
          <h3>
            {t.name}
            <span>{t.englishName}</span>
            {selected && <small className="selected-tag">قالب فعلی</small>}
          </h3>
          <p>{t.category}</p>
        </div>
        <div className="template-actions">
          <Link
            href={`/preview/${id}`}
            className="icon-btn"
            aria-label={`مشاهده ${t.name}`}
          >
            <ArrowUpLeft size={19} />
          </Link>
          {onSelect && (
            <ActionButton
              className="text-btn"
              disabled={selected}
              aria-label={
                selected ? `قالب ${t.name} فعال است` : `انتخاب قالب ${t.name}`
              }
              onClick={() => onSelect(id)}
            >
              {selected ? "فعال" : "انتخاب"} <ArrowLeft size={14} />
            </ActionButton>
          )}
        </div>
      </div>
    </article>
  );
}

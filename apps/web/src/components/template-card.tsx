"use client";
import Link from "next/link";
import { ActionButton } from "./ui";
import { templates, TemplateId } from "@araland/shared";
import { ArrowUpLeft, ArrowLeft, BookOpen, Plus } from "lucide-react";

function PreviewStar() {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 6v88M6 50h88M19 19l62 62M19 81l62-62" stroke="currentColor" strokeWidth="13" /></svg>;
}

export function TemplatePreview({ id }: { id: TemplateId }) {
  const t = templates.find((t) => t.id === id)!;
  return (
    <div className={`template-art art-${id} identity-preview`}>
      {id === "pulse" && <img className="pv-pulse-background" src={t.image} alt="" loading="lazy" />}
      <div className="pv-navigation">
        <b>{t.englishName}</b>
        <span>{id === "forma" ? "یادگیری　 همراهی" : id === "pulse" ? "تمرین　 شروع حرکت" : id === "luma" ? "مراقبت　 آشنایی" : id === "bloom" ? "مراقبت　 آرامش" : "پروژه‌ها　 استودیو"}</span>
        <ArrowUpLeft aria-hidden="true" />
      </div>
      {id === "orbit" ? (
        <div className="pv-orbit-scene">
          <h3>فضا برای زندگی.<br /><span>طراحی برای ماندن.</span></h3>
          <div className="pv-orbit-frame">
            <img src={t.image} alt="فضای معماری گرم و مینیمال" loading="lazy" />
            <span><ArrowUpLeft aria-hidden="true" /></span>
          </div>
          <div className="pv-orbit-caption"><span>نگاهی به استودیو مدار</span><span>معماری و طراحی فضا</span></div>
        </div>
      ) : id === "bloom" ? (
        <div className="pv-bloom-scene">
          <span className="pv-bloom-kicker">کمی نزدیک‌تر به خودت</span>
          <h3>کمی آرام‌تر،<br /><em>کمی برای خودت.</em></h3>
          <div className="pv-bloom-oval"><img src={t.image} alt="فضای آرام مراقبت و تندرستی" loading="lazy" /><span>✳</span></div>
          <span className="pv-bloom-pill">زمانی برای خودت <ArrowUpLeft aria-hidden="true" /></span>
        </div>
      ) : id === "forma" ? (
        <div className="pv-forma-scene">
          <h3>فردای تو،<br /><span>از اینجا شروع می‌شود.</span></h3>
          <div className="pv-forma-board">
            <div className="pv-forma-note"><BookOpen aria-hidden="true" /><b>یک مهارت تازه،<br />یک فرصت تازه.</b><span>مسیرت را پیدا کن ↖</span></div>
            <div className="pv-forma-photo"><img src={t.image} alt="گروهی در حال یادگیری و همکاری" loading="lazy" /></div>
            <div className="pv-forma-tab"><PreviewStar /><b>آکادمی<br />فردا</b><ArrowLeft aria-hidden="true" /></div>
          </div>
          <div className="pv-forma-syllabus"><span>۰۱　طراحی تجربه کاربری</span><span>۰۲　استراتژی برند</span></div>
        </div>
      ) : id === "pulse" ? (
        <div className="pv-pulse-scene">
          <span className="pv-pulse-kicker">با ریتم خودت</span>
          <h3>حال خوب،<br />از حرکت<br /><em>شروع می‌شه.</em></h3>
          <span className="pv-pulse-action">قدم اول رو بردار <ArrowUpLeft aria-hidden="true" /></span>
          <div className="pv-pulse-tracks" aria-hidden="true"><i /><i /><i /></div>
          <span className="pv-pulse-footer">تپش، همراهِ حرکت تو</span>
        </div>
      ) : (
        <div className="pv-luma-scene">
          <div className="pv-luma-heading"><span><Plus aria-hidden="true" />مراقبت، با نگاه انسانی</span><h3>زیبایی، با خیال آسوده.</h3></div>
          <div className="pv-luma-body">
            <div className="pv-luma-note"><span className="pv-luma-rule" /><p>فرصتی برای شنیدن شما.<br />مسیری برای مراقبت آگاهانه.</p><span className="pv-luma-action">درخواست مشاوره<ArrowLeft aria-hidden="true" /></span><Plus className="pv-luma-plus" aria-hidden="true" /></div>
            <div className="pv-luma-image"><img src={t.image} alt="مراقبت و زیبایی طبیعی" loading="lazy" /><span>روشا<Plus aria-hidden="true" /></span></div>
          </div>
        </div>
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

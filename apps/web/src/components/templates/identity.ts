import type { TemplateId } from "@araland/shared";

export const templateIdentity = {
  orbit: {
    symbol: "⌑", action: "از فضای خود بگویید", stories: "از قاب نزدیک", quotes: "روایت یک همکاری",
    faq: "پیش از ترسیم اولین خط", contact: "طرح بعدی، از یک گفتگو", journal: "دفتر معماری", footer: "برای زندگی، جا باز کنیم.",
    menu: { services: "فضاها و طراحی", about: "نگاه استودیو", blog: "دفتر معماری", contact: "گفتگوی پروژه" },
  },
  bloom: {
    symbol: "✳", action: "زمانی برای خودتان", stories: "لحظه‌ای برای آرامش", quotes: "حرف‌هایی از دل", faq: "با خیال آسوده شروع کنید",
    contact: "یک مکث، فقط برای شما", journal: "یادداشت‌های آرام", footer: "کمی به خودتان نزدیک‌تر.",
    menu: { services: "تجربه‌های مراقبت", about: "حال‌وهوای ما", blog: "یادداشت‌ها", contact: "با هم در تماس" },
  },
  forma: {
    symbol: "↗", action: "مسیرت را پیدا کن", stories: "از دل کارگاه", quotes: "حاشیه‌های یک مسیر", faq: "قبل از فصل اول",
    contact: "صفحه بعدی را تو بنویس", journal: "دفتر یادگیری", footer: "ادامه این داستان، با تو.",
    menu: { services: "مسیرهای یادگیری", about: "شیوه همراهی", blog: "دفتر یادگیری", contact: "قدم بعدی" },
  },
  pulse: {
    symbol: "↗", action: "شروع حرکت", stories: "داخل جریان تمرین", quotes: "صداهای هم‌مسیر", faq: "خط شروع",
    contact: "حرکت بعدی با توست", journal: "فراتر از تمرین", footer: "با ریتم خودت، ادامه بده.",
    menu: { services: "مسیرهای تمرین", about: "روح حرکت", blog: "یادداشت تمرین", contact: "شروع حرکت" },
  },
  luma: {
    symbol: "✺", action: "درخواست مشاوره", stories: "نگاهی نزدیک‌تر", quotes: "تجربه همراهان", faq: "راهنمای پیش از مراجعه",
    contact: "فرصتی برای شنیدن شما", journal: "آگاهی و مراقبت", footer: "مراقبت، از شنیدن آغاز می‌شود.",
    menu: { services: "حوزه‌های مراقبت", about: "نگاه ما", blog: "آگاهی و مراقبت", contact: "درخواست مشاوره" },
  },
} satisfies Record<TemplateId, {
  symbol: string; action: string; stories: string; quotes: string; faq: string;
  contact: string; journal: string; footer: string;
  menu: Record<"services" | "about" | "blog" | "contact", string>;
}>;

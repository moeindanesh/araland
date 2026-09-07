export type TemplateId = "orbit" | "bloom" | "forma";
export type SectionType =
  | "hero"
  | "services"
  | "about"
  | "testimonials"
  | "faq"
  | "contact"
  | "instagram"
  | "stories"
  | "blog";
export interface SectionItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  url?: string;
}
export interface Section {
  id: string;
  type: SectionType;
  enabled: boolean;
  title: string;
  subtitle?: string;
  items?: SectionItem[];
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
}
export interface SiteContent {
  brand: { name: string; tagline: string; primaryColor: string; logo?: string };
  sections: Section[];
}
export interface Site {
  id: string;
  name: string;
  slug: string;
  templateId: TemplateId;
  status: "DRAFT" | "PUBLISHED";
  draft: SiteContent;
  published: SiteContent | null;
  publishedAt: string | null;
  updatedAt: string;
  seo: { title: string; description: string };
}
export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  options?: string[];
}
export interface SiteForm {
  id: string;
  title: string;
  fields: FormField[];
}
export interface Lead {
  id: string;
  formTitle: string;
  values: Record<string, string>;
  fieldLabels?: Record<string, string>;
  createdAt: string;
}
export interface Member {
  id: string;
  phone: string;
  name?: string;
  createdAt: string;
}
export interface SiteFile {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  recipientPhone: string;
  createdAt: string;
}
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover?: string;
  published: boolean;
  createdAt: string;
}
export interface Domain {
  id: string;
  hostname: string;
  status: "PENDING" | "VERIFIED";
  verificationToken: string;
  createdAt: string;
}
export interface Stats {
  visits: number;
  leads: number;
  members: number;
  conversion: number;
  series: { label: string; value: number }[];
}
export interface User {
  id: string;
  phone: string;
  name: string | null;
}
export const sectionLabels: Record<SectionType, string> = {
  hero: "بخش اصلی",
  services: "خدمات",
  about: "درباره ما",
  testimonials: "نظر مشتریان",
  faq: "سوالات متداول",
  contact: "فرم ارتباط",
  instagram: "اینستاگرام",
  stories: "استوری‌ها",
  blog: "بلاگ",
};
export const templates: {
  id: TemplateId;
  name: string;
  englishName: string;
  category: string;
  description: string;
  color: string;
  image: string;
  tags: string[];
}[] = [
  {
    id: "orbit",
    name: "مدار",
    englishName: "ORBIT",
    category: "استودیو و خدمات خلاق",
    description: "جایی برای ایده‌هایی که دیده می‌شوند.",
    color: "#245b49",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=85",
    tags: ["مینیمال", "پروژه‌محور"],
  },
  {
    id: "bloom",
    name: "آرام",
    englishName: "BLOOM",
    category: "زیبایی و سلامت",
    description: "یک تجربه آرام، از اولین نگاه.",
    color: "#7e876b",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=85",
    tags: ["لطیف", "رزرو خدمات"],
  },
  {
    id: "forma",
    name: "فردا",
    englishName: "FORMA",
    category: "آموزش و مشاوره",
    description: "شروع بزرگ بعدی، همین‌جاست.",
    color: "#d5f778",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=85",
    tags: ["جسور", "دوره و آموزش"],
  },
];
const image = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=85`;
export function createContent(templateId: TemplateId): SiteContent {
  const t = templates.find((t) => t.id === templateId) ?? templates[0];
  const names = {
    orbit: "استودیو مدار",
    bloom: "خانه آرام",
    forma: "آکادمی فردا",
  };
  const heroes = {
    orbit: "فضا برای زندگی.\nطراحی برای ماندن.",
    bloom: "کمی آرام‌تر،\nکمی نزدیک‌تر به خودت.",
    forma: "فردای تو،\nاز اینجا شروع می‌شود.",
  };
  const descriptions = {
    orbit:
      "ما ایده‌های شما را به فضاهایی تبدیل می‌کنیم که داستانی برای گفتن دارند. طراحی داخلی، معماری و جزئیات ماندگار.",
    bloom:
      "در خانه آرام، مراقبت از شما یک هنر است. تجربه‌ای شخصی از زیبایی و تندرستی، در فضایی برای نفس کشیدن.",
    forma:
      "مهارت‌های واقعی را با آدم‌های حرفه‌ای یاد بگیر. مسیر تازه‌ات را بساز و برای قدم بعدی آماده شو.",
  };
  const services =
    templateId === "orbit"
      ? [
          {
            id: "s1",
            title: "معماری داخلی",
            description: "فضایی که شخصیت شما را روایت می‌کند.",
            image: image("photo-1600607687920-4e2a09cf159d"),
          },
          {
            id: "s2",
            title: "طراحی فضاهای کاری",
            description: "برای ایده‌های تازه، جای تازه می‌سازیم.",
            image: image("photo-1497366754035-f200968a6e72"),
          },
          {
            id: "s3",
            title: "طراحی و چیدمان",
            description: "زیبایی در کوچک‌ترین جزئیات.",
            image: image("photo-1600210492493-0946911123ea"),
          },
        ]
      : templateId === "bloom"
        ? [
            {
              id: "s1",
              title: "مراقبت از پوست",
              description: "درخشش طبیعی با مراقبت اختصاصی.",
              image: image("photo-1570172619644-dfd03ed5d881"),
            },
            {
              id: "s2",
              title: "ماساژ و آرامش",
              description: "لحظه‌ای فقط برای خودتان.",
              image: image("photo-1544161515-4ab6ce6db874"),
            },
            {
              id: "s3",
              title: "مشاوره زیبایی",
              description: "بهترین مسیر برای زیبایی منحصربه‌فرد شما.",
              image: image("photo-1540555700478-4be289fbecef"),
            },
          ]
        : [
            {
              id: "s1",
              title: "طراحی تجربه کاربری",
              description: "از ایده تا محصول، با پروژه‌های واقعی.",
              image: image("photo-1559028012-481c04fa702d"),
            },
            {
              id: "s2",
              title: "استراتژی برند",
              description: "برندی بساز که در ذهن‌ها بماند.",
              image: image("photo-1522202176988-66273c2fd55f"),
            },
            {
              id: "s3",
              title: "رشد کسب‌وکار",
              description: "از دانش تا تصمیم‌های تاثیرگذار.",
              image: image("photo-1522071820081-009f0129c71c"),
            },
          ];
  return {
    brand: {
      name: names[templateId],
      tagline: t.category,
      primaryColor: t.color,
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        title: heroes[templateId],
        subtitle: descriptions[templateId],
        image: t.image,
        buttonText:
          templateId === "forma"
            ? "مسیر یادگیری‌ات را پیدا کن"
            : "رزرو جلسه آشنایی",
        buttonUrl: "#contact",
      },
      {
        id: "stories",
        type: "stories",
        enabled: true,
        title: "از نزدیک ببینید",
        items: services.map((s, i) => ({ ...s, id: `story${i}` })),
      },
      {
        id: "services",
        type: "services",
        enabled: true,
        title:
          templateId === "forma"
            ? "یک مهارت تازه، یک فرصت تازه"
            : templateId === "bloom"
              ? "مراقبتی به لطافت شما"
              : "هر فضا، یک داستان تازه",
        subtitle:
          templateId === "orbit"
            ? "منتخبی از آنچه با عشق ساخته‌ایم"
            : "مسیر مناسب خودتان را انتخاب کنید.",
        items: services,
      },
      {
        id: "about",
        type: "about",
        enabled: true,
        title:
          templateId === "forma"
            ? "کنار آدم‌های درست، رشد کن."
            : templateId === "bloom"
              ? "برای خوب بودن، اینجا جا هست."
              : "ما به تاثیر فضاها باور داریم.",
        subtitle: descriptions[templateId],
        image: services[1].image,
      },
      {
        id: "testimonials",
        type: "testimonials",
        enabled: true,
        title: "داستان‌هایی از همراهی",
        items: [
          {
            id: "t1",
            title: "نرگس محمدی",
            description:
              "از اولین گفتگو تا نتیجه نهایی، همه‌چیز با دقت و توجه پیش رفت. تجربه‌ای که با خیال راحت پیشنهاد می‌کنم.",
          },
          {
            id: "t2",
            title: "علی رضایی",
            description:
              "کیفیت کار و همراهی تیم فراتر از انتظارم بود. خوشحالم که این مسیر را با شما شروع کردم.",
          },
        ],
      },
      {
        id: "faq",
        type: "faq",
        enabled: true,
        title: "شاید سوال شما هم باشد",
        items: [
          {
            id: "f1",
            title: "چطور می‌توانم شروع کنم؟",
            description:
              "فرم پایین صفحه را پر کنید. تیم ما برای یک گفتگوی اولیه با شما تماس می‌گیرد.",
          },
          {
            id: "f2",
            title: "آیا مشاوره اولیه رایگان است؟",
            description:
              "بله، جلسه آشنایی اولیه برای بررسی نیاز شما رایگان است.",
          },
          {
            id: "f3",
            title: "خدمات به صورت آنلاین هم ارائه می‌شود؟",
            description: "بله، امکان مشاوره و همراهی آنلاین هم وجود دارد.",
          },
        ],
      },
      {
        id: "instagram",
        type: "instagram",
        enabled: false,
        title: "روزمره‌های ما در اینستاگرام",
        subtitle: "تصاویر منتخب؛ هر تصویر به پست اصلی پیوند دارد.",
        items: [],
      },
      {
        id: "blog",
        type: "blog",
        enabled: true,
        title: "برای خواندن، برای الهام گرفتن",
        items: [],
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        title:
          templateId === "forma"
            ? "قدم بعدی را با هم برداریم."
            : "از یک گفتگوی خوب شروع کنیم.",
        subtitle: "اطلاعاتتان را بگذارید تا در اولین فرصت با شما تماس بگیریم.",
        buttonText: "درخواست مشاوره",
      },
    ],
  };
}
export function createDemoSite(templateId: TemplateId = "orbit"): Site {
  return {
    id: "demo",
    name: "استودیو مدار",
    slug: "madar-studio",
    templateId,
    status: "DRAFT",
    draft: createContent(templateId),
    published: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    seo: { title: "استودیو مدار", description: "طراحی و معماری با نگاهی تازه" },
  };
}
export const API_URL = "http://localhost:4000/api";
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  baseUrl = API_URL,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ error: "ارتباط با سرور برقرار نشد" }));
    throw new Error(data.error || "درخواست انجام نشد");
  }
  return response.json() as Promise<T>;
}

/** Normalize cleared optional controls before API validation. */
export function normalizeContent(content: SiteContent): SiteContent {
  return {
    ...content,
    brand: { ...content.brand, logo: content.brand.logo?.trim() || undefined },
    sections: content.sections.map((section) => ({
      ...section,
      image: section.image?.trim() || undefined,
      buttonUrl: section.buttonUrl?.trim() || undefined,
      items: section.items?.map((item) => ({
        ...item,
        image: item.image?.trim() || undefined,
        url: item.url?.trim() || undefined,
      })),
    })),
  };
}
export function createInitialContent(templateId: TemplateId): SiteContent {
  const content = createContent(templateId);
  content.sections = content.sections.map((section) =>
    section.type === "testimonials"
      ? { ...section, enabled: false, items: [] }
      : section,
  );
  return content;
}

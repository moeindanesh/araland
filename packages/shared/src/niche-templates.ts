import type { SectionItem, SiteContent } from "./index";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=1000&q=80`;

/** These are editable template starting points, never verified business claims. */
export function createNicheContent(id: "pulse" | "luma"): SiteContent {
  const fitness = id === "pulse";
  const services: SectionItem[] = fitness ? [
    { id: "strength", title: "قدرت، از پایه", description: "تمرین قدرتی؛ متناسب با تجربه، هدف و ریتم زندگی تو.", image: photo("photo-1534438327276-14e5300c3a48"), url: "#contact" },
    { id: "balance", title: "تعادل و انعطاف", description: "فضایی برای حرکت آگاهانه، تمرکز و ارتباط دوباره با بدن.", image: photo("photo-1544367567-0f2fcb009e0b"), url: "#contact" },
    { id: "coaching", title: "همراهی شخصی", description: "از شناخت نقطه شروع تا پیگیری مسیر؛ قدم‌به‌قدم کنار تو.", image: "/images/templates/pulse-hero.webp", url: "#contact" },
  ] : [
    { id: "skin", title: "شناخت و مراقبت پوست", description: "شروع مراقبت با گفتگو درباره نیازها، سابقه و انتظارات شما.", image: photo("photo-1570172619644-dfd03ed5d881"), url: "#contact" },
    { id: "aesthetics", title: "مشاوره زیبایی", description: "فرصتی برای پرسیدن، شناخت گزینه‌ها و تصمیم‌گیری آگاهانه.", image: "/images/templates/luma-hero.webp", url: "#contact" },
    { id: "followup", title: "مراقبت و پیگیری", description: "راه ارتباطی روشن برای هماهنگی مراجعه و پرسش‌های بعدی.", image: photo("photo-1629909613654-28e377c37b09"), url: "#contact" },
  ];
  return {
    brand: {
      name: fitness ? "باشگاه تپش" : "کلینیک روشا",
      tagline: fitness ? "تمرین آگاهانه. زندگی پرانرژی." : "پزشکی و زیبایی، با نگاه انسانی.",
      primaryColor: fitness ? "#d5f46a" : "#234a64",
    },
    sections: [
      {
        id: "hero", type: "hero", enabled: true,
        title: fitness ? "حال خوب،\nاز حرکت شروع می‌شه." : "زیبایی،\nبا خیال آسوده.",
        subtitle: fitness
          ? "اینجا قرار نیست شبیه کسی باشی. مسیر خودت را پیدا کن؛ با تمرینی که برای تو و زندگی تو معنا دارد."
          : "از شنیدن شما شروع می‌کنیم. فضایی برای شناخت نیازها، پرسیدن سوال‌ها و انتخاب آگاهانه مسیر مراقبت.",
        image: `/images/templates/${id}-hero.webp`,
        buttonText: fitness ? "قدم اول رو بردار" : "درخواست مشاوره",
        buttonUrl: "#contact",
      },
      {
        id: "services", type: "services", enabled: true,
        title: fitness ? "هر هدفی،\nیک مسیر برای حرکت." : "مراقبتی که\nاز شما شروع می‌شود.",
        subtitle: fitness ? "قدرت، تعادل یا یک شروع تازه؛ از همین‌جا انتخاب کن." : "خدمات را بشناسید و درباره مسیر مناسب خودتان گفتگو کنید.",
        items: services,
      },
      {
        id: "about", type: "about", enabled: true,
        title: fitness ? "بیشتر از تمرین.\nیک قرار با خودت." : "فرصت شنیده‌شدن.\nزمانی برای شما.",
        subtitle: fitness
          ? "حرکت خوب، از شناخت خودت شروع می‌شود. هدف ما ساختن فضایی است که در آن با هر نقطه شروعی، برای ادامه‌دادن انگیزه داشته باشی. برای آشنایی با مربیان، فضای تمرین و نحوه همراهی با ما گفتگو کن."
          : "هر چهره داستان خودش را دارد. پیش از هر انتخاب، باید برای شناخت انتظارها، توضیح گزینه‌ها و پرسش‌های شما وقت گذاشت. برای آشنایی با تیم، جزئیات خدمات و هماهنگی مراجعه با ما در ارتباط باشید.",
        image: fitness ? photo("photo-1517836357463-d25dfeac3438") : photo("photo-1629909613654-28e377c37b09"),
        buttonText: fitness ? "از مسیرت بگو" : "با ما گفتگو کنید",
        buttonUrl: "#contact",
      },
      {
        id: "stories", type: "stories", enabled: true,
        title: fitness ? "از نزدیک، با تپش" : "از نزدیک، با روشا",
        items: services.map((item) => ({ ...item, id: `story-${item.id}` })),
      },
      {
        id: "testimonials", type: "testimonials", enabled: false,
        title: fitness ? "داستان همراهان تپش" : "تجربه همراهان روشا", items: [],
      },
      {
        id: "faq", type: "faq", enabled: true,
        title: fitness ? "قبل از شروع،\nشاید بپرسی…" : "پرسش‌های شما،\nپیش از مراجعه.",
        items: fitness ? [
          { id: "start", title: "برای شروع باید آمادگی بدنی داشته باشم؟", description: "برای هماهنگی گفتگوی اولیه، از نقطه شروع و هدفت بگو. شرایط شرکت و برنامه مناسب را پیش از ثبت‌نام با مربی بررسی کن." },
          { id: "times", title: "زمان و هزینه کلاس‌ها را چطور بپرسم؟", description: "در فرم ارتباط، نام برنامه موردنظرت را بنویس. تیم مجموعه درباره زمان‌های موجود و شرایط ثبت‌نام با تو هماهنگ می‌کند." },
          { id: "request", title: "با ارسال فرم، ثبت‌نام من قطعی می‌شود؟", description: "خیر؛ فرم فقط درخواست تماس را ثبت می‌کند. انتخاب زمان و ثبت‌نام پس از هماهنگی با مجموعه انجام می‌شود." },
        ] : [
          { id: "appointment", title: "چطور برای مراجعه هماهنگ کنم؟", description: "فرم درخواست مشاوره را تکمیل کنید. ارسال فرم به معنی رزرو قطعی نیست؛ زمان مراجعه پس از تماس و هماهنگی با کلینیک مشخص می‌شود." },
          { id: "choice", title: "چطور خدمت مناسب خودم را انتخاب کنم؟", description: "اطلاعات سایت برای آشنایی اولیه است. انتخاب خدمت و بررسی مناسب‌بودن آن نیازمند مشاوره و ارزیابی فردی توسط متخصص است." },
          { id: "privacy", title: "چه اطلاعاتی در فرم بنویسم؟", description: "نام، شماره تماس و موضوع کلی درخواست کافی است. اطلاعات پزشکی، تصاویر شخصی و مدارک حساس را در فرم عمومی ارسال نکنید." },
          { id: "cost", title: "هزینه و شرایط خدمات را از کجا بدانم؟", description: "جزئیات هزینه، مراقبت‌ها و شرایط مراجعه را پیش از تصمیم‌گیری از تیم کلینیک دریافت کنید." },
        ],
      },
      { id: "blog", type: "blog", enabled: true, title: fitness ? "برای بهتر حرکت‌کردن" : "برای انتخاب آگاهانه‌تر", items: [] },
      {
        id: "contact", type: "contact", enabled: true,
        title: fitness ? "آماده‌ای\nریتمت رو پیدا کنی؟" : "یک گفتگو،\nآغاز مراقبت.",
        subtitle: fitness
          ? "از هدفت بگو. برای آشنایی با برنامه‌ها و هماهنگی شروع با تو تماس می‌گیریم. ارسال این فرم، ثبت‌نام قطعی نیست."
          : "نام و شماره تماس خود را بگذارید تا برای مشاوره هماهنگ کنیم. این فرم برای رزرو قطعی یا ارسال اطلاعات و مدارک پزشکی نیست.",
        buttonText: fitness ? "درخواست شروع" : "ثبت درخواست مشاوره",
      },
    ],
  };
}

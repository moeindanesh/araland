# طراحی و منابع تصویری

طراحی رابط، لوگوتایپ و نشان CSS آرالند و چیدمان پنج قالب در این پروژه ساخته شده‌اند. آثار مرجع برای زبان بصری و تجربه بررسی شده‌اند و قالب خریداری‌شده یا کد آن‌ها کپی نشده است؛ منابع در RESEARCH.md و GLOBAL-BENCHMARK-2026-09-08.md آمده‌اند.

- فونت پنل وب و اپ مدیریت: **IRANYekanXFaNum** از بسته اصلی ارائه‌شده کاربر. وب از WOFF2 در وزن‌های ۴۰۰، ۵۰۰، ۶۰۰، ۷۰۰، ۸۰۰ و ۹۰۰ در `apps/web/public/fonts/iranyekanx` استفاده می‌کند؛ موبایل از TTF اصلی در وزن‌های ۴۰۰ تا ۷۰۰ در `apps/mobile/assets/fonts`. متن مجوز مالکیتی بسته در `FontLicense.txt` هر دو پوشه بدون تغییر نگهداری شده است. فونت‌ها محلی‌اند و بارگیری از سرویس خارجی ندارند.
- فونت قالب‌های عمومی همچنان Vazirmatn v33.003، با مجوز SIL Open Font License؛ متن مجوز در apps/web/public/fonts/OFL.txt نگهداری می‌شود.
- تصاویر محیط، استودیو، سلامت و آموزش از Unsplash با URLهای ثبت‌شده در packages/shared/src/index.ts و تصویر ورود بارگذاری می‌شوند. برای کسب‌وکار واقعی باید با تصاویر دارای حق استفاده همان کسب‌وکار جایگزین شوند.
- تصاویر کوچک چهره در پیش‌نمایش آموزشی از pravatar هستند و فقط در حالت نمونه نمایش داده می‌شوند.
- نام‌ها و نقل‌قول‌های پیش‌نمایش‌ها نمونه‌اند. سایت‌های واقعی تازه‌ساخته‌شده بخش نظرات را غیرفعال و بدون نقل‌قول شروع می‌کنند.
- وابستگی به میزبان خارجی تصاویر در این نسخه وجود دارد. کتابخانه رسانه امکان جایگزینی با تصاویر بارگذاری‌شده در storage سرور را دارد.

## تصویرهای اصلی تپش و روشا — ۸ سپتامبر ۲۰۲۶

هر دو با ابزار داخلی `image_gen.imagegen` تولید شدند؛ فراخوانی API تصویرسازی داخل محصول انجام نشد. تصاویر فایل مستقل داخل پروژه‌اند و متن/CTA قالب در HTML قابل ویرایش است. مدل دقیق ابزار داخلی در خروجی اعلام نشده بود و به مدل مشخصی نسبت داده نمی‌شود. خروجی PNG با Sharp به WebP فشرده شد؛ عکس‌های خدمات فرعی همچنان از URLهای Unsplash در `packages/shared/src/niche-templates.ts` استفاده می‌کنند.

| دارایی نهایی | ابعاد | حجم |
| --- | --- | --- |
| `apps/web/public/images/templates/pulse-hero.webp` | ۱۵۳۶ × ۱۰۲۴ | ۸۱۴۸۴ بایت |
| `apps/web/public/images/templates/luma-hero.webp` | ۱۰۲۴ × ۱۵۳۶ | ۵۱۰۷۶ بایت |

Brief قابل استفاده مجدد برای تصویر تپش (بازنویسی مشخصات هنری، نه transcript دقیق ابزار):

```text
Use case: photorealistic-natural
Asset type: sports and wellness website hero
Subject: adult Middle Eastern female runner in modest dark navy sportswear
Scene: sculptural sage-green running track, architectural curves
Composition: athletic motion, editorial framing, space around the subject
Lighting: cinematic natural daylight; tactile surfaces and realistic anatomy
Palette: deep green, charcoal, muted sage; no text, logo, watermark or UI
```

Brief قابل استفاده مجدد برای تصویر روشا:

```text
Use case: photorealistic-natural
Asset type: medical and beauty website editorial portrait
Subject: adult Middle Eastern woman in a high-neck ivory top
Composition: vertical portrait, calm expression, natural skin and visible pores
Lighting: soft ivory light and restrained cool-blue accents
Scene: clean quiet studio; refined, human and approachable
Constraints: no medical procedure, no before/after, no retouching promise,
no text, logo, watermark or UI
```

این اشخاص، پزشک معرفی‌شده، مراجعه‌کننده واقعی، تأییدکننده خدمت یا مدرک نتیجه درمان نیستند. تصاویر به‌عنوان تصویرسازی هویت قالب استفاده می‌شوند؛ صاحب کسب‌وکار باید اطلاعات واقعی، مجوزها و تصاویر مجاز خودش را در محتوای نهایی قرار دهد.

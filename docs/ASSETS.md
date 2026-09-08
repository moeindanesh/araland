# طراحی و منابع تصویری

طراحی رابط، لوگوتایپ و نشان CSS آرالند و چیدمان پنج قالب در این پروژه ساخته شده‌اند. آثار مرجع برای زبان بصری و تجربه بررسی شده‌اند و قالب خریداری‌شده یا کد آن‌ها کپی نشده است؛ منابع در RESEARCH.md و GLOBAL-BENCHMARK-2026-09-08.md آمده‌اند.

- فونت پنل وب و اپ مدیریت: **IRANYekanXFaNum** از بسته اصلی ارائه‌شده کاربر. وب از WOFF2 در وزن‌های ۴۰۰، ۵۰۰، ۶۰۰، ۷۰۰، ۸۰۰ و ۹۰۰ در `apps/web/public/fonts/iranyekanx` استفاده می‌کند؛ موبایل از TTF اصلی در وزن‌های ۴۰۰ تا ۷۰۰ در `apps/mobile/assets/fonts`. متن مجوز مالکیتی بسته در `FontLicense.txt` هر دو پوشه بدون تغییر نگهداری شده است. فونت‌ها محلی‌اند و بارگیری از سرویس خارجی ندارند.
- فونت قالب‌های عمومی همچنان Vazirmatn v33.003، با مجوز SIL Open Font License؛ متن مجوز در apps/web/public/fonts/OFL.txt نگهداری می‌شود.
- تصاویر پیش‌فرض پنج قالب اکنون محلی‌اند؛ فایل‌های WebP در `apps/web/public/images/templates` قرار دارند و از `packages/shared` به آن‌ها ارجاع داده می‌شود. تصاویر مفهومی‌اند و جای عکس واقعی کسب‌وکار را نمی‌گیرند. تصویر صفحه ورود و URLهای ذخیره‌شده قدیمی ممکن است همچنان از Unsplash باشند.
- نوار چهره‌های نمونه pravatar از قالب آموزشی حذف شد.
- نام‌ها و نقل‌قول‌های پیش‌نمایش‌ها نمونه‌اند. سایت‌های واقعی تازه‌ساخته‌شده بخش نظرات را غیرفعال و بدون نقل‌قول شروع می‌کنند.
- پیش‌نمایش‌های تازه قالب به میزبان خارجی تصاویر وابسته نیستند. دادهٔ سایت‌های موجود و تصاویر سفارشی کاربر در این بازطراحی بازنویسی نشده‌اند؛ کتابخانه رسانه امکان جایگزینی با تصاویر بارگذاری‌شده در storage سرور را دارد.

## تصویرهای اصلی تپش و روشا — ۸ سپتامبر ۲۰۲۶

هر دو با ابزار داخلی `image_gen.imagegen` تولید شدند؛ فراخوانی API تصویرسازی داخل محصول انجام نشد. تصاویر فایل مستقل داخل پروژه‌اند و متن/CTA قالب در HTML قابل ویرایش است. مدل دقیق ابزار داخلی در خروجی اعلام نشده بود و به مدل مشخصی نسبت داده نمی‌شود. خروجی PNG با Sharp به WebP فشرده شد؛ عکس‌های خدمات فرعی نیز در بازطراحی هویت قالب‌ها به دارایی‌های مفهومی محلی تغییر کردند.

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

## تصاویر تکمیلی بازطراحی هویت

[پرامپت‌ها و منبع تصاویر اصلی جدید](TEMPLATE-IMAGE-PROMPTS.md) و [پرامپت‌های تصاویر تکمیلی](TEMPLATE-SUPPLEMENTAL-IMAGES.md) روش تولید با ابزار داخلی، محل فایل‌ها و ابعاد خروجی را ثبت می‌کنند. تصویرها به WebP بهینه شده‌اند و متن سایت داخل تصویر قرار ندارد.

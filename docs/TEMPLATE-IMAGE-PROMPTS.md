# پرامپت و منبع تصاویر اختصاصی قالب‌ها

تاریخ تولید: ۸ سپتامبر ۲۰۲۶.

این سه تصویر با ابزار داخلی `image_gen` و سه درخواست مستقلِ هم‌زمان تولید شدند؛ از CLI یا کلید API استفاده نشد. تصاویر، مفهوم عمومیِ معماری، تندرستی و یادگیری را نمایش می‌دهند و عکس پروژه، مکان، کارکنان، مدرس یا مخاطب واقعیِ کسب‌وکار محسوب نمی‌شوند. متن، لوگو، گواهی و ادعای اعتبار در آن‌ها وجود ندارد.

هر سه خروجی اصلی با `view_image` بررسی شدند. فایل‌های PNG اصلی در مسیر تولید داخلی حفظ شده‌اند. نسخه‌های پروژه فقط با Sharp، کیفیت WebP برابر ۸۶ و effort برابر ۶ بهینه شده‌اند؛ ابعاد و ترکیب‌بندی تغییر نکرده است. قاب‌بندی نهاییِ کارت و صفحه در CSS انجام می‌شود.

| قالب | فایل پروژه | ابعاد | اندازه، بایت |
| --- | --- | --- | --- |
| مدار · Orbit | `apps/web/public/images/templates/orbit-hero.webp` | 1536 × 1024 | 270580 |
| آرام · Bloom | `apps/web/public/images/templates/bloom-hero.webp` | 1122 × 1402 | 155450 |
| فردا · Forma | `apps/web/public/images/templates/forma-hero.webp` | 1536 × 1024 | 151494 |

## مدار · Orbit

- روش تولید: ابزار داخلی `image_gen`، تصویر تازه، بدون تصویر مرجع.
- خروجی اصلی: `/Users/hypermadar/.codex/generated_images/01a0811c-3cce-7e40-9b49-edfc1682fa55/exec-75fbb01f-b074-4b14-9ce5-c18b9ef4bf6c.png`.
- فایل نهایی: `apps/web/public/images/templates/orbit-hero.webp`.
- شناسهٔ مدل از ابزار گزارش نشده است؛ مدل مشخصی نسبت داده نمی‌شود.

پرامپت دقیق ارسال‌شده:

```text
Use case: photorealistic-natural
Asset type: full-width architectural website hero photograph, landscape 3:2.
Primary request: an original warm contemporary architectural interior with a quiet, human scale.
Scene/backdrop: a spacious sunlit living room with pale limewashed walls, a tall rectangular opening into a second room, a low cream linen sofa, warm walnut joinery, a travertine coffee table, and one sculptural ceramic vessel.
Style/medium: refined editorial architectural photography, realistic material texture and precise vertical lines.
Composition/framing: wide eye-level view with layered depth; furniture and architectural opening comfortably inside the frame, suitable for a broad horizontal crop. No people.
Lighting/mood: warm natural afternoon light, soft directional shadows, calm and inhabited rather than showroom glossy.
Color palette: warm ivory, sand, walnut brown, muted olive.
Constraints: a generic concept interior, not an identifiable real project or property. No text, lettering, signage, logos, watermark, captions, or UI. No collage or rendered website.
```

## آرام · Bloom

- روش تولید: ابزار داخلی `image_gen`، تصویر تازه، بدون تصویر مرجع.
- خروجی اصلی: `/Users/hypermadar/.codex/generated_images/01a0811c-3cce-7e40-9b49-edfc1682fa55/exec-c0db18f8-74fd-4ee8-8ce6-95e57ed674ae.png`.
- فایل نهایی: `apps/web/public/images/templates/bloom-hero.webp`.
- شناسهٔ مدل از ابزار گزارش نشده است؛ مدل مشخصی نسبت داده نمی‌شود.

پرامپت دقیق ارسال‌شده:

```text
Use case: photorealistic-natural
Asset type: serene wellness website hero photograph, portrait-friendly 4:5 composition.
Primary request: an original calming spa interior still life that can be cropped into a centered oval.
Scene/backdrop: a quiet sunlit wellness room with warm plaster walls, a soft linen-covered treatment bench, neatly folded cream towels, a shallow ceramic bowl, a small branch of leaves, and a translucent curtain.
Style/medium: premium natural editorial interior and still-life photography with tactile linen, ceramic, and plaster details.
Composition/framing: keep the bench, towel and ceramic focal point close to the center with generous breathing room all around, so an oval crop preserves the meaningful subjects. No people, no procedures, no product packaging.
Lighting/mood: diffuse morning daylight filtered through linen, soft shadows, slow and intimate.
Color palette: cream, warm blush beige, muted sage and pale oak.
Constraints: generic conceptual wellness setting, no real clinic or identity claims. No text, lettering, signage, brand logos, watermark, captions, or UI. No collage or rendered website.
```

## فردا · Forma

- روش تولید: ابزار داخلی `image_gen`، تصویر تازه، بدون تصویر مرجع.
- خروجی اصلی: `/Users/hypermadar/.codex/generated_images/01a0811c-3cce-7e40-9b49-edfc1682fa55/exec-eb916ce1-5d38-4fbf-ad5b-2be83b7f7963.png`.
- فایل نهایی: `apps/web/public/images/templates/forma-hero.webp`.
- شناسهٔ مدل از ابزار گزارش نشده است؛ مدل مشخصی نسبت داده نمی‌شود.

پرامپت دقیق ارسال‌شده:

```text
Use case: photorealistic-natural
Asset type: creative learning website workshop photograph, landscape 3:2, also suitable for a near-square paper-photo crop.
Primary request: an original candid scene of four adults collaborating around a creative workshop table.
Scene/backdrop: an airy modest creative studio with a large light-wood table; adult participants in casual contemporary clothing arranging colored blank paper cards, a simple notebook with no readable writing, pencils, and a closed laptop.
Style/medium: authentic documentary editorial photography with natural expressions and realistic hands, a conversational moment rather than a posed corporate team portrait.
Composition/framing: medium-wide three-quarter view looking slightly down toward the table, participants grouped centrally, face and hand details natural and unobstructed; avoid tiny background people. Keep key subjects within the central portion for a near-square crop.
Lighting/mood: soft natural window light, relaxed collaborative energy.
Color palette: warm ivory studio, muted lavender and orange paper accents, natural wood and understated clothing.
Constraints: all people are fictional adults, generic learning concept, no recognizable public figures, no certificates, no credential or testimonial implication. No text, lettering, signage, logos, watermark, captions, or UI. No collage or rendered website.
```


## تصاویر تکمیلی خدمات · ۸ سپتامبر ۲۰۲۶

دو تصویر زیر نیز در دو درخواست مستقلِ هم‌زمان با ابزار داخلی `image_gen` تولید و با `view_image` بررسی شدند. تبدیل به WebP با Sharp، کیفیت ۸۶ و effort برابر ۶ انجام شد؛ ابعاد 1536 × 1024 و ترکیب‌بندی اصلی حفظ شدند. این تصاویر، مفهوم عمومی خدمات را نشان می‌دهند؛ فرد در تصویر تپش، شخصیت بزرگسالِ ساختگی است و معرفی مربی واقعی نیست.

### bloom-massage

- فایل نهایی: `apps/web/public/images/templates/bloom-massage.webp`، 192302 بایت.
- خروجی اصلی: `/Users/hypermadar/.codex/generated_images/01a0811c-3cce-7e40-9b49-edfc1682fa55/exec-267047ba-e5ec-47b1-a560-c5de82a46814.png`.
- روش تولید: ابزار داخلی `image_gen`، تصویر تازه، بدون تصویر مرجع؛ مدل مشخصی از ابزار گزارش نشده است.

پرامپت دقیق ارسال‌شده:

```text
Use case: photorealistic-natural
Asset type: supporting wellness service photograph, landscape 3:2, suitable for a centered near-square crop.
Primary request: a warm tactile spa still life of folded linen, smooth stones, and an amber massage oil bowl.
Scene/backdrop: a pale travertine surface in a quiet warm plaster wellness room; neatly folded cream linen towels, three smooth natural river stones, and one small handmade ceramic bowl holding amber oil.
Style/medium: natural editorial still-life photography with realistic material textures.
Composition/framing: intimate close-up with all key objects centrally grouped and room around them for a near-square crop, a simple uncluttered arrangement.
Lighting/mood: soft side-lit daylight, restful and warm.
Color palette: ivory linen, warm sand, muted brown stones, translucent amber oil.
Constraints: generic conceptual spa imagery. No people, hands, product bottles, labels, text, logos, watermark, signage, UI, or collage.
```

### pulse-balance

- فایل نهایی: `apps/web/public/images/templates/pulse-balance.webp`، 81462 بایت.
- خروجی اصلی: `/Users/hypermadar/.codex/generated_images/01a0811c-3cce-7e40-9b49-edfc1682fa55/exec-2817979e-fa6e-46c6-8784-1b8962319737.png`.
- روش تولید: ابزار داخلی `image_gen`، تصویر تازه، بدون تصویر مرجع؛ مدل مشخصی از ابزار گزارش نشده است.

پرامپت دقیق ارسال‌شده:

```text
Use case: photorealistic-natural
Asset type: supporting balance and mobility service photograph, landscape 3:2, suitable for a centered near-square crop.
Primary request: one fictional adult in modest casual exercise clothing gently stretching in a serene sage-colored movement studio.
Scene/backdrop: a quiet airy studio with pale sage plaster walls, warm natural oak floor, diffuse daylight from a tall window, and one plain exercise mat.
Subject: a single adult wearing a loose long-sleeved muted charcoal top and full-length relaxed exercise pants, barefoot, performing a simple standing side stretch with arms extended overhead and a slight lateral bend.
Style/medium: authentic editorial fitness photography with realistic anatomy, naturally aligned joints, fingers, hands and feet.
Composition/framing: medium-wide full-body view, the entire person including both hands and both feet fully visible with generous space at every edge; subject near center, suitable for a near-square crop.
Lighting/mood: calm daylight, focused and grounded, natural unposed energy.
Color palette: soft sage, charcoal, pale wood and warm ivory.
Constraints: generic exercise concept with a fictional adult, no real trainer or qualification claim. No text, logos, watermark, mirrors with duplicated anatomy, extra people, signage, UI, or collage.
```

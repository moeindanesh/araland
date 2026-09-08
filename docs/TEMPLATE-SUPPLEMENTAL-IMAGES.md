# تصاویر مکمل قالب‌ها — ۸ سپتامبر ۲۰۲۶

این شش تصویر برای جایگزینی عکس‌های مکمل وابسته به میزبان خارجی و تقویت هویت مستقل قالب‌ها با ابزار داخلی `image_gen.imagegen` تولید شدند. هر دارایی یک فراخوانی مستقل داشت. از CLI، SDK یا API تصویرسازی محصول استفاده نشد؛ مدل دقیق ابزار داخلی در پاسخ اعلام نشد و نام مدل به آن نسبت داده نمی‌شود.

تصاویر، صحنه‌های مفهومی اصیل برای قالب هستند؛ سند یک پروژه اجراشده، فضای واقعی کسب‌وکار، هنرجو، مراجعه‌کننده یا نتیجه خدمت نیستند. مالک سایت باید تصاویر و اطلاعات مجاز و مناسب کسب‌وکار خودش را انتخاب کند. متن و CTA داخل HTML باقی می‌مانند و در فایل تصویر درج نشده‌اند.

خروجی‌های اصلی PNG پس از بازبینی بصری با `Sharp` نصب‌شده در `apps/api` و تنظیمات `webp({quality:84,effort:6})` به WebP تبدیل شدند. ابعاد، ترکیب‌بندی و نسبت تصویر تغییر نکرد. اصل PNG در مسیر پیش‌فرض ابزار حفظ شده است. تمامی نسخه‌های نهایی مصرف‌شونده داخل پروژه ذخیره شدند.

| فایل نهایی | کاربرد مفهومی | ابعاد | حجم بایت |
| --- | --- | --- | ---: |
| `apps/web/public/images/templates/orbit-workspace.webp` | فضای کار معماری | ۱۵۳۶ × ۱۰۲۴ | 170682 |
| `apps/web/public/images/templates/orbit-detail.webp` | جزئیات مبلمان و متریال | ۱۵۳۶ × ۱۰۲۴ | 222640 |
| `apps/web/public/images/templates/bloom-care.webp` | چیدمان مراقبت و آرامش | ۱۵۳۶ × ۱۰۲۴ | 184138 |
| `apps/web/public/images/templates/forma-workshop.webp` | میز کارگاه یادگیری | ۱۵۳۶ × ۱۰۲۴ | 163144 |
| `apps/web/public/images/templates/pulse-strength.webp` | فضای تمرین قدرتی | ۱۵۳۶ × ۱۰۲۴ | 209354 |
| `apps/web/public/images/templates/luma-space.webp` | فضای گفتگو و مشاوره | ۱۵۳۶ × ۱۰۲۴ | 166856 |

## بازبینی بصری

هر شش خروجی در نتیجه ابزار مشاهده و تأیید شدند: ترکیب و رنگ با قالب مربوط هماهنگ است؛ نشانه تجاری، نوشته خوانا، واترمارک یا ادعای نتیجه وجود ندارد. همه صحنه‌ها و چیدمان‌ها عمومی و مفهومی‌اند؛ در تصویر کارگاه تنها دست و ساعد بزرگسالان دیده می‌شود و نوشته دفترها خوانا نیست. تصویر فضای مشاوره شامل فرد، ابزار درمانی، گواهی یا رویه درمانی نیست.

## پرامپت‌های دقیق و مبدأ فایل

### orbit-workspace

- فایل نهایی: `apps/web/public/images/templates/orbit-workspace.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-6bef0d4a-7bd2-4bcf-a84a-78e6ee8c44d8.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photo for an architecture studio website template
Primary request: warm architectural office interior, no people.
Scene: refined contemporary creative studio with a solid oak shared worktable, simple architectural chairs, pale textured plaster walls, broad side window and a few material samples laid neatly on the table.
Style: natural high-end architectural editorial photography, realistic perspective, tactile materials, a believable modest-scale room rather than a luxury fantasy.
Composition: landscape 3:2 photograph, wide interior view with balanced depth, suitable for cropping as a service card or about image. No UI or text overlays.
Lighting and palette: soft late-morning daylight, warm off-white, muted olive, natural oak and quiet stone gray, gentle shadows.
Constraints: empty room, no people, no recognizable branded furniture, no logos, no signs, no readable text, no watermark; original generic concept image, not documentation of a real business.
```

### orbit-detail

- فایل نهایی: `apps/web/public/images/templates/orbit-detail.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-e1795f74-46a6-4744-8e92-535b83d4f0e7.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photo for an architecture studio website template
Primary request: sculptural chair and textured architectural material detail.
Scene: close editorial composition of one unbranded curved natural-wood chair beside a pale travertine plinth, a folded linen swatch and subtle limewashed wall, with restrained geometric shadows.
Style: realistic architectural materials photography with visible wood grain, natural stone pores and soft linen texture.
Composition: landscape 3:2 image with a close, considered crop, chair and material relationships as the subject, suitable for cropping to square or wide website image. No UI or copy.
Lighting and palette: directional natural window light, warm ivory, pale sand, walnut and muted olive-gray.
Constraints: no people, no replica of a famous designer product, no logos, no signs, no readable text, no watermark; original generic concept scene, not a real portfolio project.
```

### bloom-care

- فایل نهایی: `apps/web/public/images/templates/bloom-care.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-b9180cc6-5615-4186-8589-53483e1ed679.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photograph for a gentle spa and wellness website template
Primary request: nonmedical spa skincare still life without labels or people.
Scene: carefully arranged small ceramic bowl, folded cream cotton towels, one unlabeled frosted glass skincare bottle, a natural loofah and a single olive branch resting on pale warm stone beside rippled water.
Style: tactile natural editorial still-life photography, calm and refined, believable scale, realistic surfaces.
Composition: landscape 3:2 image with a close arrangement and generous breathing room, suitable for a service card or about photograph. No UI.
Lighting and palette: diffuse morning light, soft sage, warm ivory, muted sand and pale stone, organic shadows.
Constraints: no people, no medical instruments, no needles, no treatment procedure, no product efficacy or outcome claims, no logos, no labels, no readable text, no watermark; original generic styling concept.
```

### forma-workshop

- فایل نهایی: `apps/web/public/images/templates/forma-workshop.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-aff2c4c4-eba6-45be-8ed4-bcb3dab155cc.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photograph for a creative learning and consulting website template
Primary request: overhead creative learning table with adult hands, notebooks and workshop materials; no readable text.
Scene: a small group of adults collaborating around a light wood table, only forearms and hands visible, blank notebooks, pencils, unmarked purple and yellow paper rectangles, simple abstract color swatches and one closed laptop.
Style: realistic candid editorial photography, energetic but considered, natural hand anatomy and convincing everyday materials.
Composition: landscape 3:2 overhead view, arrangement fills the frame naturally with multiple distinct work areas, useful as a learning card and about image; no faces or UI.
Lighting and palette: bright soft daylight, warm neutrals, restrained vivid violet and yellow accents matching a creative academy identity.
Constraints: adults only, correct hands with five fingers, no readable text, no legible handwriting, no logos, no certificates, no claims about actual students or results, no watermark; original generic workshop illustration.
```

### pulse-strength

- فایل نهایی: `apps/web/public/images/templates/pulse-strength.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-2fd3381b-41ad-417a-abc4-23495957d72d.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photograph for an athletic training website template
Primary request: editorial empty strength-training gym with equipment and no people.
Scene: a compact refined training space with matte dark metal dumbbells on a low rack, one weight-training bench, a pair of kettlebells and a textured rubber floor; deep forest-green wall and an architectural side window.
Style: cinematic but realistic athletic editorial photography, crisp tactile equipment and believable physical scale.
Composition: landscape 3:2 photograph, low three-quarter camera angle, foreground equipment as the focal point, ample depth for cropping into a wide service lane or about image. No UI.
Lighting and palette: sculptural natural sidelight, dark forest green, charcoal, graphite, subtle neon yellow-green detail on a training mat edge, restrained highlights.
Constraints: empty gym, no people, no visible logos, no weight numbers or readable text, no signage, no watermark, no fabricated performance or membership claims; original generic concept scene.
```

### luma-space

- فایل نهایی: `apps/web/public/images/templates/luma-space.webp`
- خروجی اصلی ابزار: `/Users/hypermadar/.codex/generated_images/01a0811c-7a18-7322-8c7d-12dbdc6e8e32/exec-8bb2aac9-2580-4829-bced-8631b2f6617c.png`
- حالت اجرا: ساخت تصویر تازه، ابزار داخلی، بدون تصویر مرجع.

```text
Use case: photorealistic-natural
Asset type: original supplemental photograph for a refined clinical consultation website template
Primary request: airy warm ivory and muted blue consultation room without people or signage.
Scene: small quiet consultation space with two comfortable simple chairs facing across a modest round table, pale ivory plaster walls, a translucent curtain filtering daylight, subtle muted blue upholstery, discreet oak cabinet and one small ceramic vase.
Style: realistic architectural editorial photography, approachable and human, clean but warm, natural textures and believable dimensions.
Composition: landscape 3:2 wide interior photograph with a composed asymmetry and soft depth, useful for a service directory thumbnail and about section; no UI.
Lighting and palette: soft indirect daylight, warm ivory, mist blue, pale oak and gentle gray shadows.
Constraints: no people, no doctors, no patients, no medical instruments, no procedures, no certificates, no signage, no logos, no readable text, no watermark; original generic consultation concept, not documentation of an actual clinic.
```

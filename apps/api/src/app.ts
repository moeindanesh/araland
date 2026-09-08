import { Elysia, t } from "elysia";
import { db, Prisma } from "@araland/db";
import {
  createInitialContent,
  isValidPageSlug,
  normalizeContent,
  normalizePageSlug,
  publicSiteContent,
  type FormField,
  type Section,
  type SiteContent,
} from "@araland/shared";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { domainToASCII } from "node:url";
import { isIP } from "node:net";
import { mkdir, unlink } from "node:fs/promises";
import { resolve, basename } from "node:path";
import {
  assert,
  HttpError,
  tokenHash,
  otpHash,
  equalHash,
  normalizePhone,
  isDevAuth,
  sendOtp,
  rateLimit,
  requestIp,
} from "./security";
import {
  contentSchema,
  fieldsSchema,
  seoSchema,
  shortText,
  templateSchema,
  postSchema,
  postPatchSchema,
} from "./schemas";
import { generateImage, saveImage, storageRoot, publicMediaUrl } from "./media";
import { allowOrigin, requestSiteScope } from "./cors";

type DbSite = Awaited<ReturnType<typeof db.site.findFirstOrThrow>>;
const json = (value: unknown) => value as Prisma.InputJsonValue;
function siteDto(site: DbSite, publicOnly = false) {
  const published = publicOnly && site.published
    ? publicSiteContent(site.published as unknown as SiteContent)
    : site.published;
  return {
    id: site.id,
    name: publicOnly ? site.publishedName || site.name : site.name,
    slug: site.slug,
    templateId: publicOnly
      ? site.publishedTemplateId || site.templateId
      : site.templateId,
    status: site.status,
    draft: publicOnly ? published : site.draft,
    published,
    publishedAt: site.publishedAt?.toISOString() || null,
    updatedAt: publicOnly
      ? site.publishedAt?.toISOString()
      : site.updatedAt.toISOString(),
    seo: publicOnly ? site.publishedSeo || site.seo : site.seo,
  };
}
const fileDto = (file: {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  recipientPhone: string;
  createdAt: Date;
}) => ({
  id: file.id,
  title: file.title,
  originalName: file.originalName,
  mimeType: file.mimeType,
  size: file.size,
  recipientPhone: file.recipientPhone,
  createdAt: file.createdAt.toISOString(),
});
async function userFrom(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  assert(token, 401, "برای ادامه وارد حساب شوید.");
  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  assert(
    session && session.expiresAt > new Date(),
    401,
    "نشست شما منقضی شده است. دوباره وارد شوید.",
  );
  const originScope = await requestSiteScope(request);
  assert(
    !session.siteScopeId || !originScope || session.siteScopeId === originScope,
    403,
    "این نشست مخصوص سایت دیگری است.",
  );
  return { ...session.user, siteScopeId: session.siteScopeId || originScope };
}
async function ownedSite(request: Request, id: string) {
  const user = await userFrom(request);
  assert(!user.siteScopeId, 403, "برای مدیریت کسب‌وکار از پنل اصلی وارد شوید.");
  const site = await db.site.findFirst({
    where: {
      id,
      workspace: { memberships: { some: { userId: user.id, role: "OWNER" } } },
    },
  });
  assert(site, 404, "سایت پیدا نشد.");
  return { site, user };
}
async function publishedSite(slug: string) {
  const site = await db.site.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null } },
  });
  assert(site?.published, 404, "این سایت هنوز منتشر نشده است.");
  return site;
}
async function sitesFor(userId: string) {
  return (
    await db.site.findMany({
      where: {
        workspace: { memberships: { some: { userId, role: "OWNER" } } },
      },
      orderBy: { createdAt: "desc" },
    })
  ).map((site) => siteDto(site));
}
async function publicSitePayload(site: DbSite) {
  const [forms, posts] = await Promise.all([
    db.siteForm.findMany({
      where: { siteId: site.id },
      select: { id: true, title: true, fields: true },
      orderBy: { createdAt: "asc" },
    }),
    db.post.findMany({
      where: { siteId: site.id, published: true },
      select: {
        id: true, title: true, slug: true, excerpt: true, body: true,
        cover: true, published: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { site: siteDto(site, true), forms, posts };
}
function validateSections(sections: Section[], pageIds: Set<string>) {
  assert(
    new Set(sections.map((s) => s.id)).size === sections.length,
    400,
    "شناسه بخش‌ها نباید تکراری باشد.",
  );
  for (const section of sections) {
    assert(!(section.buttonPageId && section.buttonUrl), 400, "برای دکمه فقط یک مقصد انتخاب کنید.");
    assert(!section.buttonPageId || pageIds.has(section.buttonPageId), 400, "صفحه مقصد دکمه در این سایت وجود ندارد.");
    if (section.items) {
      assert(
        new Set(section.items.map((i) => i.id)).size === section.items.length,
        400,
        "شناسه آیتم‌ها نباید تکراری باشد.",
      );
      for (const item of section.items) {
        assert(!(item.pageId && item.url), 400, "برای هر آیتم فقط یک مقصد انتخاب کنید.");
        assert(!item.pageId || pageIds.has(item.pageId), 400, "صفحه مقصد آیتم در این سایت وجود ندارد.");
      }
    }
  }
}
function validateContent(content: SiteContent) {
  const pages = content.pages ?? [];
  const pageIds = new Set(pages.map((page) => page.id));
  assert(pageIds.size === pages.length, 400, "شناسه صفحه‌ها نباید تکراری باشد.");
  assert(new Set(pages.map((page) => normalizePageSlug(page.slug))).size === pages.length, 400, "آدرس صفحه‌ها در هر سایت باید یکتا باشد.");
  validateSections(content.sections, pageIds);
  for (const page of pages) {
    assert(page.title.trim().length > 0, 400, "عنوان صفحه را وارد کنید.");
    assert(isValidPageSlug(page.slug), 400, "آدرس صفحه باید با حروف انگلیسی، عدد و خط تیره نوشته شود و رزرو شده نباشد.");
    validateSections(page.sections, pageIds);
  }
  const homeSectionIds = new Set(content.sections.map((section) => section.id));
  for (const items of [content.navigation?.header ?? [], content.navigation?.footer ?? []]) {
    assert(new Set(items.map((item) => item.id)).size === items.length, 400, "شناسه لینک‌ها در هر فهرست نباید تکراری باشد.");
    for (const item of items) {
      assert(item.label.trim().length > 0, 400, "عنوان لینک فهرست را وارد کنید.");
      const target = item.target;
      assert(target.type !== "page" || pageIds.has(target.pageId), 400, "صفحه مقصد فهرست در این سایت وجود ندارد.");
      assert(target.type !== "section" || homeSectionIds.has(target.sectionId), 400, "بخش مقصد فهرست در صفحه اصلی وجود ندارد.");
    }
  }
}
function validateFields(fields: FormField[]) {
  assert(
    new Set(fields.map((f) => f.id)).size === fields.length,
    400,
    "شناسه فیلدها نباید تکراری باشد.",
  );
  assert(
    fields.every((f) => f.type !== "select" || !!f.options?.length),
    400,
    "برای فیلد انتخابی، گزینه تعریف کنید.",
  );
  assert(fields.every((field) => !field.options || new Set(field.options.map((option) => option.trim())).size === field.options.length), 400, "گزینه‌های فیلد انتخابی نباید تکراری باشند.");
  assert(
    fields.every(
      (f) => !["__proto__", "constructor", "prototype"].includes(f.id),
    ),
    400,
    "شناسه فیلد معتبر نیست.",
  );
}

export function createApp() {
  if (process.env.NODE_ENV === "production") {
    assert(
      process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
      500,
      "AUTH_SECRET must contain at least 32 characters.",
    );
    assert(
      process.env.AUTH_DEV_MODE !== "true",
      500,
      "Development OTP must be disabled in production.",
    );
  }
  return new Elysia({ serve: { maxRequestBodySize: 25 * 1024 * 1024 } })
    .onRequest(async ({ request, set }) => {
      const origin = await allowOrigin(request);
      set.headers.vary = "Origin";
      if (origin) {
        set.headers["access-control-allow-origin"] = origin;
        set.headers["access-control-allow-methods"] =
          "GET, POST, PATCH, DELETE, OPTIONS";
        set.headers["access-control-allow-headers"] =
          "Content-Type, Authorization";
        set.headers["access-control-max-age"] = "600";
      }
      if (request.method === "OPTIONS")
        return new Response(null, { status: origin ? 204 : 403 });
      assert(origin !== false, 403, "این مبدا اجازه دسترسی ندارد.");
    })
    .onAfterHandle(({ set }) => {
      set.headers["x-content-type-options"] = "nosniff";
      set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
      set.headers["cache-control"] ??= "no-store";
    })
    .onError(({ error, code, set }) => {
      if (error instanceof HttpError) {
        set.status = error.status;
        return { error: error.message };
      }
      if (code === "VALIDATION" || code === "PARSE") {
        set.status = 400;
        return { error: "اطلاعات واردشده معتبر نیست. فیلدها را بررسی کنید." };
      }
      if (code === "NOT_FOUND") {
        set.status = 404;
        return { error: "مسیر پیدا نشد." };
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        set.status = 409;
        return { error: "این آدرس قبلاً استفاده شده است." };
      }
      console.error("API error", error instanceof Error ? error.name : code);
      set.status = 500;
      return { error: "خطایی در سرور رخ داد. دوباره تلاش کنید." };
    })
    .get("/api/health", async () => {
      await db.$queryRaw`SELECT 1`;
      return { ok: true, service: "araland-api", devAuth: isDevAuth() };
    })
    .post(
      "/api/auth/request",
      async ({ body, request, server }) => {
        const phone = normalizePhone(body.phone);
        const originScope = await requestSiteScope(request);
        const requestedSite = body.siteSlug
          ? await publishedSite(body.siteSlug)
          : null;
        assert(
          !originScope || !requestedSite || requestedSite.id === originScope,
          403,
          "ورود فقط برای همین سایت مجاز است.",
        );
        const siteScopeId = originScope || requestedSite?.id || null;
        rateLimit(`otp-ip:${requestIp(request, server)}`, 30, 3600);
        rateLimit(`otp-phone:${phone}`, 1, 60);
        const recent = await db.otpChallenge.findMany({
          where: { phone, createdAt: { gte: new Date(Date.now() - 3600_000) } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        assert(
          recent.length < 5 &&
            (!recent[0] || recent[0].createdAt.getTime() < Date.now() - 60_000),
          429,
          "کمی صبر کنید و دوباره کد ورود بخواهید.",
        );
        const challengeId = randomUUID();
        const code = randomInt(100000, 1000000).toString();
        await db.otpChallenge.create({
          data: {
            id: challengeId,
            phone,
            siteScopeId,
            codeHash: otpHash(challengeId, code),
            expiresAt: new Date(Date.now() + 180_000),
          },
        });
        try {
          await sendOtp(phone, code);
        } catch (error) {
          await db.otpChallenge.delete({ where: { id: challengeId } });
          throw error;
        }
        return {
          challengeId,
          expiresIn: 180,
          ...(isDevAuth() ? { devCode: code } : {}),
        };
      },
      {
        body: t.Object({
          phone: t.String({ minLength: 10, maxLength: 30 }),
          siteSlug: t.Optional(
            t.String({
              minLength: 3,
              maxLength: 63,
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            }),
          ),
        }),
      },
    )
    .post(
      "/api/auth/verify",
      async ({ body, request, server }) => {
        rateLimit(`verify:${requestIp(request, server)}`, 100, 600);
        const challenge = await db.otpChallenge.findUnique({
          where: { id: body.challengeId },
        });
        assert(
          challenge &&
            !challenge.consumedAt &&
            challenge.expiresAt > new Date() &&
            challenge.attempts < 5,
          400,
          "کد ورود نامعتبر یا منقضی شده است.",
        );
        const verifyScope = await requestSiteScope(request);
        assert(
          !verifyScope || challenge.siteScopeId === verifyScope,
          403,
          "این کد فقط در محل درخواست اولیه قابل استفاده است.",
        );
        const scopedSite = challenge.siteScopeId
          ? await db.site.findFirst({
              where: { id: challenge.siteScopeId, status: "PUBLISHED" },
              select: { slug: true },
            })
          : null;
        assert(
          !challenge.siteScopeId || scopedSite,
          403,
          "این سایت دیگر در دسترس نیست.",
        );
        const updated = await db.otpChallenge.updateMany({
          where: {
            id: challenge.id,
            consumedAt: null,
            expiresAt: { gt: new Date() },
            attempts: { lt: 5 },
          },
          data: { attempts: { increment: 1 } },
        });
        assert(
          updated.count &&
            equalHash(otpHash(challenge.id, body.code), challenge.codeHash),
          400,
          "کد ورود نامعتبر یا منقضی شده است.",
        );
        const token = randomBytes(32).toString("base64url");
        const user = await db.$transaction(async (tx) => {
          const consumed = await tx.otpChallenge.updateMany({
            where: {
              id: challenge.id,
              consumedAt: null,
              expiresAt: { gt: new Date() },
            },
            data: { consumedAt: new Date() },
          });
          assert(consumed.count, 400, "این کد قبلاً استفاده شده است.");
          const user = await tx.user.upsert({
            where: { phone: challenge.phone },
            update: {},
            create: { phone: challenge.phone },
          });
          await tx.session.create({
            data: {
              userId: user.id,
              siteScopeId: challenge.siteScopeId,
              tokenHash: tokenHash(token),
              expiresAt: new Date(Date.now() + 30 * 86400_000),
            },
          });
          return user;
        });
        return {
          token,
          user: { id: user.id, phone: user.phone, name: user.name },
          siteScopeId: challenge.siteScopeId,
          siteSlug: scopedSite?.slug || null,
          sites: challenge.siteScopeId ? [] : await sitesFor(user.id),
        };
      },
      {
        body: t.Object({
          challengeId: t.String({ format: "uuid" }),
          code: t.String({ pattern: "^[0-9]{6}$" }),
        }),
      },
    )
    .post("/api/auth/logout", async ({ request }) => {
      await userFrom(request);
      await db.session.deleteMany({
        where: {
          tokenHash: tokenHash(request.headers.get("authorization")!.slice(7)),
        },
      });
      return { ok: true };
    })
    .get("/api/me", async ({ request }) => {
      const user = await userFrom(request);
      return {
        user: { id: user.id, phone: user.phone, name: user.name },
        siteScopeId: user.siteScopeId,
      };
    })
    .get("/api/sites", async ({ request }) => {
      const user = await userFrom(request);
      assert(
        !user.siteScopeId,
        403,
        "برای مدیریت کسب‌وکار از پنل اصلی وارد شوید.",
      );
      return { sites: await sitesFor(user.id) };
    })
    .post(
      "/api/sites",
      async ({ request, body }) => {
        const user = await userFrom(request);
        assert(
          !user.siteScopeId,
          403,
          "برای مدیریت کسب‌وکار از پنل اصلی وارد شوید.",
        );
        assert(
          ![
            "api",
            "www",
            "admin",
            "app",
            "portal",
            "templates",
            "dashboard",
          ].includes(body.slug),
          400,
          "این آدرس رزرو شده است.",
        );
        const content = createInitialContent(body.templateId);
        content.brand.name = body.name;
        const site = await db.$transaction(async (tx) => {
          let membership = await tx.membership.findFirst({
            where: { userId: user.id, role: "OWNER" },
          });
          if (!membership) {
            const workspace = await tx.workspace.create({
              data: {
                name: `فضای کاری ${body.name}`,
                memberships: { create: { userId: user.id } },
              },
            });
            membership = await tx.membership.findFirstOrThrow({
              where: { workspaceId: workspace.id },
            });
          }
          const site = await tx.site.create({
            data: {
              workspaceId: membership.workspaceId,
              name: body.name,
              slug: body.slug,
              templateId: body.templateId,
              draft: json(content),
              seo: { title: body.name, description: content.brand.tagline },
            },
          });
          await tx.siteForm.create({
            data: {
              siteId: site.id,
              title: "درخواست مشاوره",
              fields: [
                {
                  id: "name",
                  label: "نام و نام خانوادگی",
                  type: "text",
                  required: true,
                },
                {
                  id: "phone",
                  label: "شماره موبایل",
                  type: "phone",
                  required: true,
                },
                {
                  id: "message",
                  label: "پیام شما",
                  type: "textarea",
                  required: false,
                },
              ],
            },
          });
          return site;
        });
        return { site: siteDto(site) };
      },
      {
        body: t.Object({
          name: shortText,
          slug: t.String({
            minLength: 3,
            maxLength: 63,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          }),
          templateId: templateSchema,
        }),
      },
    )
    .get("/api/sites/:id", async ({ request, params }) => ({
      site: siteDto((await ownedSite(request, params.id)).site),
    }))
    .patch(
      "/api/sites/:id",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        const draft = body.draft ? normalizeContent(body.draft) : undefined;
        if (draft) validateContent(draft);
        const site = await db.site.update({
          where: { id: params.id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(draft ? { draft: json(draft) } : {}),
            ...(body.seo ? { seo: json(body.seo) } : {}),
          },
        });
        return { site: siteDto(site) };
      },
      {
        body: t.Object({
          name: t.Optional(shortText),
          draft: t.Optional(contentSchema),
          seo: t.Optional(seoSchema),
        }),
      },
    )
    .post("/api/sites/:id/publish", async ({ request, params }) => {
      const { site } = await ownedSite(request, params.id);
      validateContent(site.draft as unknown as SiteContent);
      return {
        site: siteDto(
          await db.site.update({
            where: { id: site.id },
            data: {
              published: json(site.draft),
              publishedTemplateId: site.templateId,
              publishedName: site.name,
              publishedSeo: json(site.seo),
              publishedAt: new Date(),
              status: "PUBLISHED",
            },
          }),
        ),
      };
    })
    .post(
      "/api/sites/:id/template",
      async ({ request, params, body }) => {
        const { site } = await ownedSite(request, params.id);
        const draft = createInitialContent(body.templateId);
        draft.brand.name = site.name;
        const previous = site.draft as unknown as SiteContent;
        draft.pages = previous.pages;
        if (previous.navigation) {
          const sectionIds = new Set(draft.sections.map((section) => section.id));
          draft.navigation = {
            header: previous.navigation.header.filter((item) => item.target.type !== "section" || sectionIds.has(item.target.sectionId)),
            footer: previous.navigation.footer.filter((item) => item.target.type !== "section" || sectionIds.has(item.target.sectionId)),
          };
        }
        return {
          site: siteDto(
            await db.site.update({
              where: { id: site.id },
              data: { templateId: body.templateId, draft: json(draft) },
            }),
          ),
        };
      },
      { body: t.Object({ templateId: templateSchema }) },
    )
    .get("/api/sites/:id/stats", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const now = new Date();
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCDate(start.getUTCDate() - 6);
      const [visits, leads, members, events] = await Promise.all([
        db.visit.count({ where: { siteId: params.id } }),
        db.lead.count({ where: { siteId: params.id } }),
        db.siteMember.count({ where: { siteId: params.id } }),
        db.visit.findMany({
          where: { siteId: params.id, createdAt: { gte: start } },
          select: { createdAt: true },
        }),
      ]);
      const series = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start.getTime() + i * 86400_000);
        return {
          label: date.toLocaleDateString("fa-IR", {
            weekday: "short",
            timeZone: "UTC",
          }),
          value: events.filter(
            (e) =>
              e.createdAt.toISOString().slice(0, 10) ===
              date.toISOString().slice(0, 10),
          ).length,
        };
      });
      return {
        visits,
        leads,
        members,
        conversion: visits ? Number(((leads / visits) * 100).toFixed(1)) : 0,
        series,
      };
    })
    .get("/api/sites/:id/leads", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        leads: await db.lead.findMany({
          where: { siteId: params.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            formTitle: true,
            values: true,
            fieldLabels: true,
            createdAt: true,
          },
          take: 1000,
        }),
      };
    })
    .get("/api/sites/:id/members", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const members = await db.siteMember.findMany({
        where: { siteId: params.id },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      return {
        members: members.map((m) => ({
          id: m.id,
          phone: m.user.phone,
          name: m.user.name,
          createdAt: m.createdAt,
        })),
      };
    })
    .get("/api/sites/:id/forms", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        forms: await db.siteForm.findMany({
          where: { siteId: params.id },
          select: { id: true, title: true, fields: true },
          orderBy: { createdAt: "asc" },
        }),
      };
    })
    .post(
      "/api/sites/:id/forms",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        validateFields(body.fields);
        return {
          form: await db.siteForm.create({
            data: {
              siteId: params.id,
              title: body.title,
              fields: json(body.fields),
            },
            select: { id: true, title: true, fields: true },
          }),
        };
      },
      { body: t.Object({ title: shortText, fields: fieldsSchema }) },
    )
    .patch(
      "/api/sites/:id/forms/:formId",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        const existing = await db.siteForm.findFirst({
          where: { id: params.formId, siteId: params.id },
        });
        assert(existing, 404, "فرم پیدا نشد.");
        if (body.fields) validateFields(body.fields);
        return {
          form: await db.siteForm.update({
            where: { id: existing.id },
            data: {
              ...(body.title !== undefined ? { title: body.title } : {}),
              ...(body.fields ? { fields: json(body.fields) } : {}),
            },
            select: { id: true, title: true, fields: true },
          }),
        };
      },
      {
        body: t.Object({
          title: t.Optional(shortText),
          fields: t.Optional(fieldsSchema),
        }),
      },
    )
    .delete("/api/sites/:id/forms/:formId", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const result = await db.siteForm.deleteMany({
        where: { id: params.formId, siteId: params.id },
      });
      assert(result.count, 404, "فرم پیدا نشد.");
      return { ok: true };
    })
    .get("/api/sites/:id/posts", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        posts: await db.post.findMany({
          where: { siteId: params.id },
          orderBy: { createdAt: "desc" },
        }),
      };
    })
    .post(
      "/api/sites/:id/posts",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        return {
          post: await db.post.create({
            data: {
              siteId: params.id,
              ...body,
              published: body.published ?? false,
            },
          }),
        };
      },
      { body: postSchema },
    )
    .patch(
      "/api/sites/:id/posts/:postId",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        const existing = await db.post.findFirst({
          where: { id: params.postId, siteId: params.id },
        });
        assert(existing, 404, "نوشته پیدا نشد.");
        return {
          post: await db.post.update({
            where: { id: existing.id },
            data: body,
          }),
        };
      },
      { body: postPatchSchema },
    )
    .delete("/api/sites/:id/posts/:postId", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const result = await db.post.deleteMany({
        where: { id: params.postId, siteId: params.id },
      });
      assert(result.count, 404, "نوشته پیدا نشد.");
      return { ok: true };
    })
    .get("/api/sites/:id/domains", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        domains: await db.domain.findMany({
          where: { siteId: params.id },
          orderBy: { createdAt: "desc" },
        }),
      };
    })
    .post(
      "/api/sites/:id/domains",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        const hostname = domainToASCII(
          body.hostname.trim().toLowerCase().replace(/\.$/, ""),
        );
        assert(
          !isIP(hostname) &&
            /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
              hostname,
            ) &&
            hostname.length <= 253 &&
            !hostname.endsWith(".localhost") &&
            !hostname.endsWith(".local"),
          400,
          "نام دامنه معتبر وارد کنید؛ مانند example.com",
        );
        return {
          domain: await db.domain.create({
            data: { siteId: params.id, hostname },
          }),
        };
      },
      {
        body: t.Object({
          hostname: t.String({ minLength: 3, maxLength: 253 }),
        }),
      },
    )
    .post(
      "/api/sites/:id/domains/:domainId/verify",
      async ({ request, params }) => {
        await ownedSite(request, params.id);
        rateLimit(`dns:${params.id}`, 10, 600);
        const domain = await db.domain.findFirst({
          where: { id: params.domainId, siteId: params.id },
        });
        assert(domain, 404, "دامنه پیدا نشد.");
        const records = await resolveTxt(`_araland.${domain.hostname}`).catch(
          () => [],
        );
        const verified = records.some(
          (record) =>
            record.join("") ===
            `araland-verification=${domain.verificationToken}`,
        );
        assert(
          verified,
          400,
          "رکورد TXT هنوز پیدا نشد. مقدار araland-verification=TOKEN را در _araland دامنه ثبت کنید و پس از انتشار DNS دوباره بررسی کنید.",
        );
        return {
          domain: await db.domain.update({
            where: { id: domain.id },
            data: { status: "VERIFIED" },
          }),
        };
      },
    )
    .delete("/api/sites/:id/domains/:domainId", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const removed = await db.domain.deleteMany({ where: { id: params.domainId, siteId: params.id } });
      assert(removed.count, 404, "دامنه پیدا نشد.");
      return { ok: true };
    })
    .get("/api/sites/:id/files", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        files: (
          await db.siteFile.findMany({
            where: { siteId: params.id },
            orderBy: { createdAt: "desc" },
          })
        ).map(fileDto),
      };
    })
    .post(
      "/api/sites/:id/files",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        const recipientPhone = normalizePhone(body.recipientPhone);
        const storageKey = randomUUID();
        const directory = resolve(storageRoot, "private");
        await mkdir(directory, { recursive: true });
        await Bun.write(resolve(directory, storageKey), body.file);
        try {
          const file = await db.siteFile.create({
            data: {
              siteId: params.id,
              title: body.title,
              recipientPhone,
              originalName: basename(body.file.name).slice(0, 250),
              storageKey,
              mimeType: body.file.type || "application/octet-stream",
              size: body.file.size,
            },
          });
          return { file: fileDto(file) };
        } catch (error) {
          await unlink(resolve(directory, storageKey)).catch(() => {});
          throw error;
        }
      },
      {
        body: t.Object({
          file: t.File({ maxSize: "20m" }),
          title: shortText,
          recipientPhone: t.String({ minLength: 10, maxLength: 30 }),
        }),
      },
    )
    .delete("/api/sites/:id/files/:fileId", async ({ request, params }) => {
      await ownedSite(request, params.id);
      const file = await db.siteFile.findFirst({ where: { id: params.fileId, siteId: params.id } });
      assert(file, 404, "فایل پیدا نشد.");
      // Revoke authorization first; a storage error must never keep the download available.
      await db.siteFile.deleteMany({ where: { id: file.id, siteId: params.id } });
      await unlink(resolve(storageRoot, "private", file.storageKey)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") console.error("Private file cleanup failed", { fileId: file.id, code: error.code });
      });
      return { ok: true };
    })
    .get("/api/files/:id/download", async ({ request, params }) => {
      const user = await userFrom(request);
      const file = await db.siteFile.findFirst({
        where: {
          id: params.id,
          ...(user.siteScopeId ? { siteId: user.siteScopeId } : {}),
          OR: [
            ...(!user.siteScopeId
              ? [
                  {
                    site: {
                      workspace: {
                        memberships: {
                          some: { userId: user.id, role: "OWNER" },
                        },
                      },
                    },
                  },
                ]
              : []),
            {
              recipientPhone: user.phone,
              site: { members: { some: { userId: user.id } } },
            },
          ],
        },
      });
      assert(file, 404, "فایل پیدا نشد یا دسترسی ندارید.");
      const stored = Bun.file(resolve(storageRoot, "private", file.storageKey));
      assert(await stored.exists(), 404, "فایل در فضای ذخیره‌سازی پیدا نشد.");
      return new Response(stored, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    })
    .get("/api/sites/:id/media", async ({ request, params }) => {
      await ownedSite(request, params.id);
      return {
        media: (
          await db.media.findMany({
            where: { siteId: params.id },
            orderBy: { createdAt: "desc" },
          })
        ).map((m) => ({
          id: m.id,
          url: publicMediaUrl(m.id),
          width: m.width,
          height: m.height,
          size: m.size,
          mimeType: m.mimeType,
        })),
      };
    })
    .post(
      "/api/sites/:id/media",
      async ({ request, params, body }) => {
        await ownedSite(request, params.id);
        assert(
          ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
            body.file.type,
          ),
          400,
          "تصویر JPG، PNG، AVIF یا WebP انتخاب کنید.",
        );
        return {
          media: await saveImage(
            params.id,
            Buffer.from(await body.file.arrayBuffer()),
            body.file.name,
          ),
        };
      },
      { body: t.Object({ file: t.File({ maxSize: "12m" }) }) },
    )
    .post(
      "/api/sites/:id/ai/image",
      async ({ request, params, body }) => {
        const { user } = await ownedSite(request, params.id);
        rateLimit(`ai:${user.id}`, 10, 3600);
        return { media: await generateImage(params.id, body.prompt) };
      },
      {
        body: t.Object({
          prompt: t.String({ minLength: 10, maxLength: 4000 }),
        }),
      },
    )
    .get("/api/media/:id", async ({ params }) => {
      const media = await db.media.findUnique({ where: { id: params.id } });
      assert(media, 404, "تصویر پیدا نشد.");
      const file = Bun.file(resolve(storageRoot, "media", media.storageKey));
      assert(await file.exists(), 404, "تصویر پیدا نشد.");
      return new Response(file, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    })
    .get("/api/public/sites/:slug", async ({ params }) => {
      const site = await publishedSite(params.slug);
      return publicSitePayload(site);
    })
    .get("/api/public/sites/:slug/pages/:pageSlug", async ({ params }) => {
      const site = await publishedSite(params.slug);
      const published = publicSiteContent(site.published as unknown as SiteContent);
      const page = published.pages?.find((candidate) => candidate.slug === params.pageSlug);
      assert(page, 404, "صفحه منتشرشده پیدا نشد.");
      return { ...(await publicSitePayload(site)), page };
    })
    .get("/api/public/domain/:hostname", async ({ params }) => {
      const domain = await db.domain.findFirst({
        where: {
          hostname: domainToASCII(params.hostname.toLowerCase()),
          status: "VERIFIED",
          site: { status: "PUBLISHED" },
        },
      });
      assert(domain, 404, "دامنه فعال پیدا نشد.");
      const site = await db.site.findUniqueOrThrow({
        where: { id: domain.siteId },
        select: { slug: true },
      });
      return { slug: site.slug };
    })
    .post(
      "/api/public/sites/:slug/forms/:formId/submit",
      async ({ params, body, request, server }) => {
        const site = await publishedSite(params.slug);
        rateLimit(`lead:${site.id}:${requestIp(request, server)}`, 10, 600);
        const form = await db.siteForm.findFirst({
          where: { id: params.formId, siteId: site.id },
        });
        assert(form, 404, "فرم پیدا نشد.");
        const values: Record<string, string> = Object.create(null);
        // Keep the labels the visitor actually saw, even after the form changes or is deleted.
        const fieldLabels: Record<string, string> = Object.create(null);
        for (const field of form.fields as unknown as FormField[]) {
          const value = body.values[field.id]?.trim() || "";
          assert(
            !field.required || value,
            400,
            `فیلد «${field.label}» را تکمیل کنید.`,
          );
          if (value) {
            if (field.type === "phone") normalizePhone(value);
            if (field.type === "email")
              assert(
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                400,
                "ایمیل معتبر وارد کنید.",
              );
            if (field.type === "select")
              assert(
                field.options?.includes(value),
                400,
                "یکی از گزینه‌های معتبر را انتخاب کنید.",
              );
          }
          values[field.id] = value;
          fieldLabels[field.id] = field.label;
        }
        await db.lead.create({
          data: {
            siteId: site.id,
            formId: form.id,
            formTitle: form.title,
            values: json(values),
            fieldLabels: json(fieldLabels),
          },
        });
        return { ok: true };
      },
      {
        body: t.Object({
          values: t.Record(
            t.String({ maxLength: 80 }),
            t.String({ maxLength: 5000 }),
            { maxProperties: 30 },
          ),
        }),
      },
    )
    .post(
      "/api/public/sites/:slug/visit",
      async ({ params, request, server }) => {
        const site = await publishedSite(params.slug);
        rateLimit(`visit:${site.id}:${requestIp(request, server)}`, 30, 3600);
        await db.visit.create({ data: { siteId: site.id } });
        return { ok: true };
      },
    )
    .post("/api/public/sites/:slug/join", async ({ params, request }) => {
      const site = await publishedSite(params.slug);
      const user = await userFrom(request);
      assert(
        !user.siteScopeId || user.siteScopeId === site.id,
        403,
        "این نشست مخصوص سایت دیگری است.",
      );
      const member = await db.siteMember.upsert({
        where: { siteId_userId: { siteId: site.id, userId: user.id } },
        update: {},
        create: { siteId: site.id, userId: user.id },
      });
      return {
        member: {
          id: member.id,
          phone: user.phone,
          name: user.name,
          createdAt: member.createdAt,
        },
      };
    })
    .get("/api/portal/:slug", async ({ params, request }) => {
      const site = await publishedSite(params.slug);
      const user = await userFrom(request);
      assert(
        !user.siteScopeId || user.siteScopeId === site.id,
        403,
        "این نشست مخصوص سایت دیگری است.",
      );
      const member = await db.siteMember.findUnique({
        where: { siteId_userId: { siteId: site.id, userId: user.id } },
      });
      assert(member, 403, "ابتدا عضو این سایت شوید.");
      const files = await db.siteFile.findMany({
        where: { siteId: site.id, recipientPhone: user.phone },
        orderBy: { createdAt: "desc" },
      });
      return {
        site: { name: site.publishedName || site.name, slug: site.slug },
        files: files.map(fileDto),
      };
    });
}
export type App = ReturnType<typeof createApp>;

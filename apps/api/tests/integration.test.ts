import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@araland/db";
import { createContent } from "@araland/shared";
import { createApp } from "../src/app";
import { normalizePhone, otpHash } from "../src/security";
import { storageRoot } from "../src/media";
import { resolve } from "node:path";
import { unlink } from "node:fs/promises";
import { randomInt, randomUUID } from "node:crypto";
import sharp from "sharp";

// Runs against configured PostgreSQL; only generated test users/workspaces are removed.
if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is required for API integration tests.");
process.env.AUTH_DEV_MODE = "true";
const app = createApp();
const run = randomUUID().slice(0, 8);
const phones = Array.from(
  { length: 5 },
  () => `091${randomInt(10000000, 100000000)}`,
);
const userIds: string[] = [];
const siteIds: string[] = [];
let owner = "",
  stranger = "",
  member = "",
  otherMember = "",
  siteId = "",
  formId = "",
  fileId = "";
const slug = `test-${run}`;

async function call(
  path: string,
  method = "GET",
  body?: unknown,
  token?: string,
) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData))
    headers["content-type"] = "application/json";
  const response = await app.handle(
    new Request(`http://localhost/api${path}`, {
      method,
      headers,
      body:
        body instanceof FormData
          ? body
          : body === undefined
            ? undefined
            : JSON.stringify(body),
    }),
  );
  const data = await response
    .clone()
    .json()
    .catch(() => null);
  return { response, data };
}
async function signIn(phone: string) {
  const challenge = await call("/auth/request", "POST", { phone });
  expect(challenge.response.status).toBe(200);
  expect(challenge.data.devCode).toMatch(/^\d{6}$/);
  const login = await call("/auth/verify", "POST", {
    challengeId: challenge.data.challengeId,
    code: challenge.data.devCode,
  });
  expect(login.response.status).toBe(200);
  userIds.push(login.data.user.id);
  return login.data.token as string;
}
beforeAll(async () => {
  owner = await signIn(phones[0]);
  stranger = await signIn(phones[1]);
  member = await signIn(phones[2]);
  otherMember = await signIn(phones[3]);
  const created = await call(
    "/sites",
    "POST",
    { name: "سایت آزمون", slug, templateId: "orbit" },
    owner,
  );
  expect(created.response.status).toBe(200);
  siteId = created.data.site.id;
  siteIds.push(siteId);
  const forms = await call(`/sites/${siteId}/forms`, "GET", undefined, owner);
  formId = forms.data.forms[0].id;
});
afterAll(async () => {
  const [files, media, workspaces] = await Promise.all([
    db.siteFile.findMany({ where: { siteId: { in: siteIds } } }),
    db.media.findMany({ where: { siteId: { in: siteIds } } }),
    db.membership.findMany({
      where: { userId: { in: userIds } },
      select: { workspaceId: true },
    }),
  ]);
  for (const file of files)
    await unlink(resolve(storageRoot, "private", file.storageKey)).catch(
      () => {},
    );
  for (const file of media)
    await unlink(resolve(storageRoot, "media", file.storageKey)).catch(
      () => {},
    );
  await db.workspace.deleteMany({
    where: { id: { in: workspaces.map((w) => w.workspaceId) } },
  });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.otpChallenge.deleteMany({
    where: { phone: { in: phones.map(normalizePhone) } },
  });
  await db.$disconnect();
});

describe("authentication and tenant isolation", () => {
  test("normalizes Persian digits and refuses invalid numbers", () => {
    expect(normalizePhone("۰۹۱۲۱۲۳۴۵۶۷")).toBe("+989121234567");
    expect(() => normalizePhone("00123456789")).toThrow();
  });
  test("requires a valid session and hides sites owned by another user", async () => {
    expect((await call(`/sites/${siteId}`)).response.status).toBe(401);
    expect(
      (await call(`/sites/${siteId}`, "GET", undefined, stranger)).response
        .status,
    ).toBe(404);
    expect(
      (await call(`/sites/${siteId}`, "PATCH", { name: "hacked" }, stranger))
        .response.status,
    ).toBe(404);
    expect(
      (await call(`/sites/${siteId}/publish`, "POST", undefined, stranger))
        .response.status,
    ).toBe(404);
    expect(
      (
        await call(
          `/sites/${siteId}/forms/${formId}`,
          "DELETE",
          undefined,
          stranger,
        )
      ).response.status,
    ).toBe(404);
    expect(
      (await call("/sites", "GET", undefined, stranger)).data.sites,
    ).toHaveLength(0);
  });
  test("OTP is hashed, rate limited and cannot be replayed", async () => {
    const challenge = await call("/auth/request", "POST", { phone: phones[4] });
    expect(challenge.response.status).toBe(200);
    const stored = await db.otpChallenge.findUniqueOrThrow({
      where: { id: challenge.data.challengeId },
    });
    expect(stored.codeHash).not.toBe(challenge.data.devCode);
    expect(stored.codeHash.length).toBe(64);
    expect(
      (await call("/auth/request", "POST", { phone: phones[4] })).response
        .status,
    ).toBe(429);
    const loginBody = { challengeId: stored.id, code: challenge.data.devCode };
    const login = await call("/auth/verify", "POST", loginBody);
    expect(login.response.status).toBe(200);
    userIds.push(login.data.user.id);
    expect(
      (await call("/auth/verify", "POST", loginBody)).response.status,
    ).toBe(400);
    const session = await db.session.findFirstOrThrow({
      where: { userId: login.data.user.id },
    });
    expect(session.tokenHash).not.toBe(login.data.token);
    expect(
      (await call("/auth/logout", "POST", undefined, login.data.token)).response
        .status,
    ).toBe(200);
    expect(
      (await call("/me", "GET", undefined, login.data.token)).response.status,
    ).toBe(401);
  });
  test("expires OTPs and locks after five wrong attempts", async () => {
    const expiredId = randomUUID();
    await db.otpChallenge.create({
      data: {
        id: expiredId,
        phone: normalizePhone(phones[0]),
        codeHash: otpHash(expiredId, "123456"),
        expiresAt: new Date(Date.now() - 1),
      },
    });
    expect(
      (
        await call("/auth/verify", "POST", {
          challengeId: expiredId,
          code: "123456",
        })
      ).response.status,
    ).toBe(400);
    const id = randomUUID();
    await db.otpChallenge.create({
      data: {
        id,
        phone: normalizePhone(phones[0]),
        codeHash: otpHash(id, "123456"),
        expiresAt: new Date(Date.now() + 180000),
      },
    });
    for (let i = 0; i < 5; i++)
      expect(
        (
          await call("/auth/verify", "POST", {
            challengeId: id,
            code: "111111",
          })
        ).response.status,
      ).toBe(400);
    expect(
      (await call("/auth/verify", "POST", { challengeId: id, code: "123456" }))
        .response.status,
    ).toBe(400);
  });
  test("consumes a valid OTP atomically under concurrent verification", async () => {
    const id = randomUUID();
    await db.otpChallenge.create({
      data: {
        id,
        phone: normalizePhone(phones[0]),
        codeHash: otpHash(id, "123456"),
        expiresAt: new Date(Date.now() + 180000),
      },
    });
    const attempts = await Promise.all(
      Array.from({ length: 4 }, () =>
        call("/auth/verify", "POST", { challengeId: id, code: "123456" }),
      ),
    );
    expect(attempts.filter((a) => a.response.status === 200)).toHaveLength(1);
  });
});

describe("publication and public forms", () => {
  test("unpublished site is private, publication is a snapshot including template", async () => {
    expect((await call(`/public/sites/${slug}`)).response.status).toBe(404);
    expect(
      (await call(`/sites/${siteId}/publish`, "POST", undefined, owner))
        .response.status,
    ).toBe(200);
    const draft = createContent("orbit");
    draft.sections[0].title = "عنوان خصوصی پیش‌نویس";
    expect(
      (
        await call(
          `/sites/${siteId}`,
          "PATCH",
          {
            name: "نام تازه خصوصی",
            draft,
            seo: { title: "SEO خصوصی", description: "خصوصی" },
          },
          owner,
        )
      ).response.status,
    ).toBe(200);
    const live = await call(`/public/sites/${slug}`);
    expect(live.response.status).toBe(200);
    expect(live.data.site.published.sections[0].title).not.toBe(
      "عنوان خصوصی پیش‌نویس",
    );
    expect(live.data.site.draft.sections[0].title).not.toBe(
      "عنوان خصوصی پیش‌نویس",
    );
    expect(live.data.site.name).toBe("سایت آزمون");
    expect(live.data.site.seo.title).toBe("سایت آزمون");
    expect(live.data.site.workspaceId).toBeUndefined();
    expect(
      (
        await call(
          `/sites/${siteId}/template`,
          "POST",
          { templateId: "bloom" },
          owner,
        )
      ).response.status,
    ).toBe(200);
    expect((await call(`/public/sites/${slug}`)).data.site.templateId).toBe(
      "orbit",
    );
    await call(`/sites/${siteId}/publish`, "POST", undefined, owner);
    expect((await call(`/public/sites/${slug}`)).data.site.templateId).toBe(
      "bloom",
    );
  });
  test("rejects unsafe content URLs and malformed form fields", async () => {
    const draft = createContent("orbit");
    draft.sections[0].buttonUrl = "javascript:alert(1)";
    expect(
      (await call(`/sites/${siteId}`, "PATCH", { draft }, owner)).response
        .status,
    ).toBe(400);
    expect(
      (
        await call(
          `/sites/${siteId}/forms`,
          "POST",
          {
            title: "Bad",
            fields: [{ id: "x", label: "x", type: "select", required: true }],
          },
          owner,
        )
      ).response.status,
    ).toBe(400);
  });
  test("validates required fields and writes a lead only for the correct site/form", async () => {
    const base = `/public/sites/${slug}/forms/${formId}/submit`;
    expect(
      (await call(base, "POST", { values: { name: "Test" } })).response.status,
    ).toBe(400);
    expect(
      (await call(base, "POST", { values: { name: "Test", phone: "invalid" } }))
        .response.status,
    ).toBe(400);
    expect(
      (
        await call(base, "POST", {
          values: {
            name: "مخاطب",
            phone: "09121112233",
            message: "سلام",
            ignored: "extra",
          },
        })
      ).response.status,
    ).toBe(200);
    const leads = await call(`/sites/${siteId}/leads`, "GET", undefined, owner);
    expect(leads.data.leads).toHaveLength(1);
    expect(leads.data.leads[0].values.ignored).toBeUndefined();
    expect(leads.data.leads[0].fieldLabels).toEqual({
      name: "نام و نام خانوادگی",
      phone: "شماره موبایل",
      message: "پیام شما",
    });
    expect(
      (await call(`/sites/${siteId}/leads`, "GET", undefined, stranger))
        .response.status,
    ).toBe(404);
    expect(
      (
        await call(`/public/sites/${slug}/forms/missing/submit`, "POST", {
          values: {},
        })
      ).response.status,
    ).toBe(404);
    await call(`/public/sites/${slug}/visit`, "POST");
    const stats = await call(`/sites/${siteId}/stats`, "GET", undefined, owner);
    expect(stats.data.leads).toBe(1);
    expect(stats.data.visits).toBe(1);
    expect(stats.data.series).toHaveLength(7);
  });
  test("publishes only marked blog posts and scopes deletion to the owner", async () => {
    await call(
      `/sites/${siteId}/posts`,
      "POST",
      {
        title: "Draft article",
        slug: "draft",
        excerpt: "draft",
        body: "Secret article",
        published: false,
      },
      owner,
    );
    const post = await call(
      `/sites/${siteId}/posts`,
      "POST",
      {
        title: "Public article",
        slug: "public",
        excerpt: "Hello",
        body: "Public content",
        published: true,
      },
      owner,
    );
    expect(post.response.status).toBe(200);
    const live = await call(`/public/sites/${slug}`);
    expect(live.data.posts).toHaveLength(1);
    expect(live.data.posts[0].slug).toBe("public");
    expect(
      (
        await call(
          `/sites/${siteId}/posts/${post.data.post.id}`,
          "DELETE",
          undefined,
          stranger,
        )
      ).response.status,
    ).toBe(404);
  });
  test("edits a draft, clears its cover, publishes and unpublishes it", async () => {
    const draft = await db.post.findFirstOrThrow({
      where: { siteId, slug: "draft" },
    });
    const path = `/sites/${siteId}/posts/${draft.id}`;
    expect(
      (await call(path, "PATCH", { published: true }, stranger)).response
        .status,
    ).toBe(404);
    expect(
      (await call(path, "PATCH", { cover: "javascript:alert(1)" }, owner))
        .response.status,
    ).toBe(400);
    const update = await call(
      path,
      "PATCH",
      {
        title: "Updated article",
        body: "Updated draft content",
        cover: "https://example.com/cover.jpg",
        published: true,
      },
      owner,
    );
    expect(update.response.status).toBe(200);
    expect(update.data.post.title).toBe("Updated article");
    expect((await call(`/public/sites/${slug}`)).data.posts).toHaveLength(2);
    const hidden = await call(
      path,
      "PATCH",
      { cover: null, published: false },
      owner,
    );
    expect(hidden.response.status).toBe(200);
    expect(hidden.data.post.cover).toBeNull();
    expect((await call(`/public/sites/${slug}`)).data.posts).toHaveLength(1);
  });
  test("edits a form without altering earlier lead responses", async () => {
    const path = `/sites/${siteId}/forms/${formId}`;
    expect(
      (await call(path, "PATCH", { title: "Unauthorized" }, stranger)).response
        .status,
    ).toBe(404);
    expect(
      (
        await call(
          path,
          "PATCH",
          {
            fields: [
              { id: "choice", label: "Choice", type: "select", required: true },
            ],
          },
          owner,
        )
      ).response.status,
    ).toBe(400);
    const edited = await call(
      path,
      "PATCH",
      {
        title: "فرم تازه",
        fields: [
          { id: "email", label: "ایمیل", type: "email", required: true },
        ],
      },
      owner,
    );
    expect(edited.response.status).toBe(200);
    expect(edited.data.form.fields[0].id).toBe("email");
    const lead = await db.lead.findFirstOrThrow({ where: { siteId } });
    expect((lead.values as Record<string, string>).name).toBe("مخاطب");
    expect(lead.formTitle).toBe("درخواست مشاوره");
    expect(lead.fieldLabels).toEqual({
      name: "نام و نام خانوادگی",
      phone: "شماره موبایل",
      message: "پیام شما",
    });
    const second = await call(
      "/sites",
      "POST",
      { name: "Second test site", slug: `other-${run}`, templateId: "forma" },
      owner,
    );
    siteIds.push(second.data.site.id);
    expect(
      (
        await call(
          `/sites/${second.data.site.id}/forms/${formId}`,
          "PATCH",
          { title: "Wrong site" },
          owner,
        )
      ).response.status,
    ).toBe(404);
    const post = await db.post.findFirstOrThrow({ where: { siteId } });
    expect(
      (
        await call(
          `/sites/${second.data.site.id}/posts/${post.id}`,
          "PATCH",
          { published: true },
          owner,
        )
      ).response.status,
    ).toBe(404);
    expect((await call(path, "DELETE", undefined, owner)).response.status).toBe(
      200,
    );
    const preserved = await call(
      `/sites/${siteId}/leads`,
      "GET",
      undefined,
      owner,
    );
    expect(preserved.data.leads[0].fieldLabels).toEqual({
      name: "نام و نام خانوادگی",
      phone: "شماره موبایل",
      message: "پیام شما",
    });
    expect(preserved.data.leads[0].values.name).toBe("مخاطب");
    expect(
      (await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).formId,
    ).toBeNull();
  });
});

describe("member portal, private files, domains and media", () => {
  test("a file is visible only to its assigned member or site owner", async () => {
    const form = new FormData();
    form.set(
      "file",
      new File(["private document"], "private.txt", { type: "text/plain" }),
    );
    form.set("title", "فایل اختصاصی");
    form.set("recipientPhone", phones[2]);
    const upload = await call(`/sites/${siteId}/files`, "POST", form, owner);
    expect(upload.response.status).toBe(200);
    fileId = upload.data.file.id;
    expect(upload.data.file.storageKey).toBeUndefined();
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, member))
        .response.status,
    ).toBe(404);
    expect(
      (await call(`/portal/${slug}`, "GET", undefined, member)).response.status,
    ).toBe(403);
    await call(`/public/sites/${slug}/join`, "POST", undefined, member);
    await call(`/public/sites/${slug}/join`, "POST", undefined, otherMember);
    const portal = await call(`/portal/${slug}`, "GET", undefined, member);
    expect(portal.data.files).toHaveLength(1);
    expect(
      (await call(`/portal/${slug}`, "GET", undefined, otherMember)).data.files,
    ).toHaveLength(0);
    const download = await call(
      `/files/${fileId}/download`,
      "GET",
      undefined,
      member,
    );
    expect(download.response.status).toBe(200);
    expect(await download.response.text()).toBe("private document");
    expect(download.response.headers.get("content-disposition")).toStartWith(
      "attachment;",
    );
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, otherMember))
        .response.status,
    ).toBe(404);
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, stranger))
        .response.status,
    ).toBe(404);
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, owner))
        .response.status,
    ).toBe(200);
    const members = await call(
      `/sites/${siteId}/members`,
      "GET",
      undefined,
      owner,
    );
    expect(members.data.members).toHaveLength(2);
  });
  test("optimizes uploaded images and rejects SVG input", async () => {
    const buffer = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: "#245b49" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set(
      "file",
      new File([Uint8Array.from(buffer)], "large.png", { type: "image/png" }),
    );
    const upload = await call(`/sites/${siteId}/media`, "POST", form, owner);
    expect(upload.response.status).toBe(200);
    expect(upload.data.media.width).toBe(2000);
    expect(upload.data.media.height).toBe(1000);
    expect(upload.data.media.mimeType).toBe("image/webp");
    const media = await call(`/media/${upload.data.media.id}`);
    expect(media.response.status).toBe(200);
    expect(media.response.headers.get("content-type")).toBe("image/webp");
    const unsafe = new FormData();
    unsafe.set(
      "file",
      new File(['<svg onload="alert(1)"/>'], "bad.svg", {
        type: "image/svg+xml",
      }),
    );
    expect(
      (await call(`/sites/${siteId}/media`, "POST", unsafe, owner)).response
        .status,
    ).toBe(400);
  });
  test("cannot route an unverified domain and reports missing AI provider honestly", async () => {
    expect(
      (
        await call(
          `/sites/${siteId}/domains`,
          "POST",
          { hostname: "127.0.0.1" },
          owner,
        )
      ).response.status,
    ).toBe(400);
    const hostname = `${run}.example.com`;
    const domain = await call(
      `/sites/${siteId}/domains`,
      "POST",
      { hostname },
      owner,
    );
    expect(domain.response.status).toBe(200);
    expect(domain.data.domain.status).toBe("PENDING");
    expect((await call(`/public/domain/${hostname}`)).response.status).toBe(
      404,
    );
    expect(
      (
        await call(
          `/sites/${siteId}/domains/${domain.data.domain.id}/verify`,
          "POST",
          undefined,
          stranger,
        )
      ).response.status,
    ).toBe(404);
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      expect(
        (
          await call(
            `/sites/${siteId}/ai/image`,
            "POST",
            { prompt: "A beautiful architectural interior" },
            owner,
          )
        ).response.status,
      ).toBe(503);
    } finally {
      if (previous) process.env.OPENAI_API_KEY = previous;
    }
  });
  test("CORS permits only explicit app origins and verified published-domain origins", async () => {
    const hostname = `cors-${run}.example.com`;
    const domain = await db.domain.create({
      data: { siteId, hostname, status: "PENDING" },
    });
    const preflight = (origin: string) =>
      app.handle(
        new Request(`http://localhost/api/public/sites/${slug}`, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
          },
        }),
      );
    expect((await preflight(`https://${hostname}`)).status).toBe(403);
    await db.domain.update({
      where: { id: domain.id },
      data: { status: "VERIFIED" },
    });
    const valid = await preflight(`https://${hostname}`);
    expect(valid.status).toBe(204);
    expect(valid.headers.get("access-control-allow-origin")).toBe(
      `https://${hostname}`,
    );
    expect(valid.headers.get("vary")).toContain("Origin");
    expect((await preflight(`https://${hostname}.evil.com`)).status).toBe(403);
    const application = await preflight("http://localhost:3000");
    expect(application.status).toBe(204);
    await db.domain.update({
      where: { id: domain.id },
      data: { status: "PENDING" },
    });
    expect((await preflight(`https://${hostname}`)).status).toBe(403);
  });
});

describe("portal session scope", () => {
  async function scopedLogin(phone: string, siteScopeId: string) {
    const id = randomUUID();
    await db.otpChallenge.create({
      data: {
        id,
        phone: normalizePhone(phone),
        siteScopeId,
        codeHash: otpHash(id, "123456"),
        expiresAt: new Date(Date.now() + 180000),
      },
    });
    const login = await call("/auth/verify", "POST", {
      challengeId: id,
      code: "123456",
    });
    expect(login.response.status).toBe(200);
    expect(login.data.sites).toHaveLength(0);
    expect(login.data.siteScopeId).toBe(siteScopeId);
    return login.data.token as string;
  }
  async function originCall(
    path: string,
    method: string,
    origin: string,
    body?: unknown,
    token?: string,
  ) {
    const response = await app.handle(
      new Request(`http://localhost/api${path}`, {
        method,
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return {
      response,
      data: await response
        .clone()
        .json()
        .catch(() => null),
    };
  }
  test("an owner identity in a portal cannot use management privileges or owner file override", async () => {
    const scopedOwner = await scopedLogin(phones[0], siteId);
    expect(
      (await call("/sites", "GET", undefined, scopedOwner)).response.status,
    ).toBe(403);
    expect(
      (
        await call(
          "/sites",
          "POST",
          { name: "forbidden", slug: `scope-${run}`, templateId: "orbit" },
          scopedOwner,
        )
      ).response.status,
    ).toBe(403);
    expect(
      (
        await call(
          `/sites/${siteId}`,
          "PATCH",
          { name: "forbidden" },
          scopedOwner,
        )
      ).response.status,
    ).toBe(403);
    expect(
      (await call(`/public/sites/${slug}/join`, "POST", undefined, scopedOwner))
        .response.status,
    ).toBe(200);
    expect(
      (await call(`/portal/${slug}`, "GET", undefined, scopedOwner)).response
        .status,
    ).toBe(200);
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, scopedOwner))
        .response.status,
    ).toBe(404);
    expect(
      (await call("/sites", "GET", undefined, owner)).response.status,
    ).toBe(200);
  });
  test("a portal member can receive its own files but cannot join or read another site", async () => {
    const scopedMember = await scopedLogin(phones[2], siteId);
    expect(
      (await call(`/files/${fileId}/download`, "GET", undefined, scopedMember))
        .response.status,
    ).toBe(200);
    const other = await call(
      "/sites",
      "POST",
      { name: "other scope", slug: `portal-other-${run}`, templateId: "bloom" },
      owner,
    );
    expect(other.response.status).toBe(200);
    const otherId = other.data.site.id;
    siteIds.push(otherId);
    await call(`/sites/${otherId}/publish`, "POST", undefined, owner);
    expect(
      (
        await call(
          `/public/sites/portal-other-${run}/join`,
          "POST",
          undefined,
          scopedMember,
        )
      ).response.status,
    ).toBe(403);
    expect(
      (await call(`/portal/portal-other-${run}`, "GET", undefined, scopedMember))
        .response.status,
    ).toBe(403);
    const upload = new FormData();
    upload.set("file", new File(["other site file"], "other.txt"));
    upload.set("title", "other");
    upload.set("recipientPhone", phones[2]);
    const otherFile = await call(
      `/sites/${otherId}/files`,
      "POST",
      upload,
      owner,
    );
    await call(`/public/sites/portal-other-${run}/join`, "POST", undefined, member);
    expect(
      (
        await call(
          `/files/${otherFile.data.file.id}/download`,
          "GET",
          undefined,
          scopedMember,
        )
      ).response.status,
    ).toBe(404);
    expect(
      (
        await call(
          `/files/${otherFile.data.file.id}/download`,
          "GET",
          undefined,
          member,
        )
      ).response.status,
    ).toBe(200);
  });
  test("merchant origins force scope and cannot redeem a manager challenge", async () => {
    const hostname = `scope-${run}.example.com`;
    await db.domain.create({ data: { hostname, siteId, status: "VERIFIED" } });
    const origin = `https://${hostname}`;
    const phone = `091${randomInt(10000000, 100000000)}`;
    phones.push(phone);
    const challenge = await originCall("/auth/request", "POST", origin, {
      phone,
    });
    expect(challenge.response.status).toBe(200);
    const stored = await db.otpChallenge.findUniqueOrThrow({
      where: { id: challenge.data.challengeId },
    });
    expect(stored.siteScopeId).toBe(siteId);
    const login = await originCall("/auth/verify", "POST", origin, {
      challengeId: stored.id,
      code: challenge.data.devCode,
    });
    expect(login.response.status).toBe(200);
    userIds.push(login.data.user.id);
    expect(login.data.sites).toHaveLength(0);
    expect(login.data.siteScopeId).toBe(siteId);
    expect(
      (await originCall("/sites", "GET", origin, undefined, owner)).response
        .status,
    ).toBe(403);
    const managerId = randomUUID();
    await db.otpChallenge.create({
      data: {
        id: managerId,
        phone: normalizePhone(phones[0]),
        codeHash: otpHash(managerId, "123456"),
        expiresAt: new Date(Date.now() + 180000),
      },
    });
    expect(
      (
        await originCall("/auth/verify", "POST", origin, {
          challengeId: managerId,
          code: "123456",
        })
      ).response.status,
    ).toBe(403);
    const valid = await call("/auth/verify", "POST", {
      challengeId: managerId,
      code: "123456",
    });
    expect(valid.response.status).toBe(200);
    expect(valid.data.siteScopeId).toBeNull();
    const other = await db.site.findUniqueOrThrow({where:{slug:`portal-other-${run}`}});
    expect(
      (
        await originCall("/auth/request", "POST", origin, {
          phone: phones[0],
          siteSlug: other.slug,
        })
      ).response.status,
    ).toBe(403);
  });
});

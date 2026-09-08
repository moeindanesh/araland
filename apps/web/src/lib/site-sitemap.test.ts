import { expect, test } from "bun:test";
import { createDemoSite, createSitePage } from "@araland/shared";
import { siteSitemap } from "./site-sitemap";

test("sitemap exposes only published enabled pages and published articles on the correct domain", () => {
  const site = createDemoSite("luma");
  site.draft.pages = [createSitePage({ title: "پیش‌نویس", kind: "page", slug: "draft" })];
  site.published = { ...site.draft, pages: [createSitePage({ title: "عمومی", kind: "service", slug: "skin" }), { ...createSitePage({ title: "خصوصی", kind: "page", slug: "hidden" }), enabled: false }] };
  const result = siteSitemap(site, [{ id: "post", title: "مطلب", slug: "پوست", published: true, excerpt: "", body: "", createdAt: "2026-09-08" }, { id: "draft", title: "پیش‌نویس", slug: "private-post", published: false, excerpt: "", body: "", createdAt: "2026-09-08" }], path => new URL(path || "/", "https://clinic.example").href);
  expect(result).toContain("https://clinic.example/skin");
  expect(result).toContain(`/blog/${encodeURIComponent("پوست")}`);
  expect(result).not.toContain("hidden");
  expect(result).not.toContain("draft");
  expect(result).not.toContain("private-post");
});

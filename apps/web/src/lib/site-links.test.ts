import { describe, expect, test } from "bun:test";
import { createInitialContent, type SiteContent } from "@araland/shared";
import { createSiteLinks } from "./site-links";

function contentFixture(): SiteContent {
  return {
    ...createInitialContent("orbit"),
    pages: [
      { id: "design", title: "طراحی", slug: "design", kind: "service", enabled: true, seo: { title: "طراحی", description: "" }, sections: [] },
      { id: "hidden", title: "غیرفعال", slug: "hidden", kind: "page", enabled: false, seo: { title: "", description: "" }, sections: [] },
    ],
    navigation: {
      header: [
        { id: "home", label: "خانه", target: { type: "home" } },
        { id: "design", label: "طراحی", target: { type: "page", pageId: "design" } },
        { id: "hidden", label: "غیرفعال", target: { type: "page", pageId: "hidden" } },
        { id: "missing", label: "حذف‌شده", target: { type: "page", pageId: "missing" } },
        { id: "contact", label: "تماس", target: { type: "section", sectionId: "contact" } },
      ],
      footer: [],
    },
  };
}

describe("public page navigation", () => {
  test("uses stable references, preserves order and omits unavailable pages", () => {
    const content = contentFixture();
    content.pages![0].slug = "interior-design";
    const links = createSiteLinks(content, "/s/studio", "design");
    expect(links.menu("header")).toEqual([
      { id: "home", label: "خانه", href: "/s/studio" },
      { id: "design", label: "طراحی", href: "/s/studio/interior-design" },
      { id: "contact", label: "تماس", href: "/s/studio#contact" },
    ]);
    expect(links.resolveLink(undefined, "design")).toBe("/s/studio/interior-design");
    expect(links.menu("footer")).toEqual([]);
  });

  test("builds clean domain links and returns to real home-section identifiers", () => {
    const content = contentFixture();
    content.sections.find((section) => section.type === "contact")!.id = "contact-custom";
    content.navigation!.header[4].target = { type: "section", sectionId: "contact-custom" };
    const links = createSiteLinks(content, "", "design");
    expect(links.homeHref).toBe("/");
    expect(links.pageHref("design")).toBe("/design");
    expect(links.resolveLink("#contact")).toBe("/#contact-custom");
    expect(links.resolveLink("/")).toBe("/");
    expect(links.resolveLink("//example.com")).toBe("/#contact-custom");
    expect(links.menu("header").at(-1)?.href).toBe("/#contact-custom");
  });

  test("preserves legacy menus while respecting intentionally empty menus", () => {
    const legacy = createInitialContent("orbit");
    expect(createSiteLinks(legacy, "/s/studio").menu("header").map((item) => item.id)).toEqual(["services", "about", "contact"]);
    legacy.navigation = { header: [], footer: [] };
    expect(createSiteLinks(legacy, "/s/studio").menu("header")).toEqual([]);
    expect(createSiteLinks(legacy, "/s/studio").menu("footer")).toEqual([]);
  });

  test("article navigation points to home instead of nonexistent article anchors", () => {
    const links = createSiteLinks(createInitialContent("orbit"), "/s/studio", undefined, true, true);
    expect(links.homeAnchors.blog).toBe("/s/studio#blog");
    expect(links.menu("header")[0].href).toBe("/s/studio#services");
  });
});

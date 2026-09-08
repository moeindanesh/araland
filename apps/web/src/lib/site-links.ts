import {
  sectionLabels,
  type NavigationItem,
  type Section,
  type SectionType,
  type SiteContent,
} from "@araland/shared";

export function visibleSiteSections(sections: Section[], hasPosts: boolean) {
  return sections.filter(
    (section) =>
      section.enabled &&
      (section.type !== "blog" || hasPosts || !!section.items?.length) &&
      (section.type !== "stories" || !!section.items?.length),
  );
}

export function sectionAnchors(sections: Section[], prefix = "") {
  const anchors: Partial<Record<SectionType, string>> = {};
  for (const section of sections)
    anchors[section.type] ??= `${prefix}#${encodeURIComponent(section.id)}`;
  return anchors;
}

export function createSiteLinks(
  content: SiteContent,
  siteBasePath: string,
  pageId?: string,
  hasPosts = false,
  awayFromHome = !!pageId,
) {
  const homeHref = siteBasePath || "/";
  const pageHref = (id: string) => {
    const page = content.pages?.find((page) => page.id === id && page.enabled);
    return page ? `${siteBasePath}/${encodeURIComponent(page.slug)}` : undefined;
  };
  const homeSections = visibleSiteSections(content.sections, hasPosts);
  const homeAnchors = sectionAnchors(homeSections, awayFromHome ? homeHref : "");
  const currentSections = pageId
    ? content.pages?.find((page) => page.id === pageId)?.sections || []
    : content.sections;
  const anchors = sectionAnchors(visibleSiteSections(currentSections, hasPosts));
  const fallbackHref =
    anchors.contact || homeAnchors.contact || anchors.services || anchors.about || homeHref;
  const resolveLink = (url?: string, targetPageId?: string) => {
    if (targetPageId) return pageHref(targetPageId) || fallbackHref;
    const href =
      url && /^(https?:\/\/|tel:|mailto:|#|\/(?:[^/]|$))/.test(url) ? url : "#contact";
    const type = href.slice(1) as SectionType;
    if (href.startsWith("#") && Object.prototype.hasOwnProperty.call(sectionLabels, type))
      return anchors[type] || homeAnchors[type] || fallbackHref;
    return href;
  };
  const navigationHref = (item: NavigationItem) => {
    const target = item.target;
    if (target.type === "home") return homeHref;
    if (target.type === "page") return pageHref(target.pageId);
    if (target.type === "section") {
      const section = homeSections.find((section) => section.id === target.sectionId);
      return section ? `${awayFromHome ? homeHref : ""}#${encodeURIComponent(section.id)}` : undefined;
    }
    return resolveLink(target.url);
  };
  const legacyHeader: { id: string; label: string; href: string }[] = [];
  for (const [type, label] of [
    ["services", "خدمات ما"],
    ["about", "درباره ما"],
    ["blog", "خواندنی‌ها"],
    ["contact", "در ارتباط باشیم"],
  ] as const) {
    const href = homeAnchors[type];
    if (href) legacyHeader.push({ id: type, label, href });
  }
  const menu = (placement: "header" | "footer") => {
    if (!content.navigation)
      return placement === "header"
        ? legacyHeader
        : homeAnchors.contact
          ? [{ id: "contact", label: "تماس با ما", href: homeAnchors.contact }]
          : [];
    return content.navigation[placement].flatMap((item) => {
      const href = navigationHref(item);
      return href ? [{ id: item.id, label: item.label, href }] : [];
    });
  };
  return { homeHref, pageHref, anchors, homeAnchors, resolveLink, menu };
}

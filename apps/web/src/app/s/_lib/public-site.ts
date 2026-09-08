import { cache } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isValidPageSlug, type Site, type SiteForm, type Post } from "@araland/shared";

export interface PublishedSiteData {
  site: Site;
  forms: SiteForm[];
  posts: Post[];
}
export async function publicSiteContext(slug: string) {
  const requestHeaders = await headers();
  const siteBasePath = requestHeaders.get("x-araland-site-slug") === slug ? "" : `/s/${slug}`;
  const origin = requestHeaders.get("x-araland-public-origin") || process.env.APP_URL || "http://localhost:3000";
  return {
    siteBasePath,
    canonical: (path = "") => new URL(`${siteBasePath}${path}` || "/", origin).toString(),
    asset: (path: string) => new URL(path, origin).toString(),
  };
}

export const loadPublishedPage = cache(async (slug: string, pageSlug: string) => {
  if (!isValidPageSlug(pageSlug)) notFound();
  const data = await loadPublishedSite(slug);
  const page = data.site.published?.pages?.find((page) => page.slug === pageSlug && page.enabled);
  if (!page) notFound();
  return { ...data, page };
});
export const loadPublishedSite = cache(
  async (slug: string): Promise<PublishedSiteData> => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 63)
      notFound();
    const base = (
      process.env.API_INTERNAL_URL || "http://localhost:4000/api"
    ).replace(/\/$/, "");
    let response: Response;
    try {
      response = await fetch(
        `${base}/public/sites/${encodeURIComponent(slug)}`,
        { cache: "no-store", signal: AbortSignal.timeout(10_000) },
      );
    } catch {
      throw new Error("PUBLIC_SITE_UNAVAILABLE");
    }
    if (response.status === 404) notFound();
    if (!response.ok) throw new Error("PUBLIC_SITE_UNAVAILABLE");
    const data = (await response.json().catch(() => {
      throw new Error("PUBLIC_SITE_UNAVAILABLE");
    })) as PublishedSiteData;
    if (
      !data.site?.published ||
      data.site.status !== "PUBLISHED" ||
      !Array.isArray(data.forms) ||
      !Array.isArray(data.posts)
    )
      throw new Error("PUBLIC_SITE_UNAVAILABLE");
    return data;
  },
);

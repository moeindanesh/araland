import type { MetadataRoute } from "next";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const customerSite = requestHeaders.get("x-araland-site-slug");
  const origin = requestHeaders.get("x-araland-public-origin");
  return {
    rules: {
      userAgent: "*",
      allow: ["/s/", "/blog/", "/"],
      disallow: ["/login", "/portal", "/preview/", "/editor", "/api/", "/live-preview"],
    },
    ...(customerSite && origin ? { sitemap: new URL("/sitemap.xml", origin).href } : {}),
  };
}

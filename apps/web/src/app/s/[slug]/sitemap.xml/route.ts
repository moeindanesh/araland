import { loadPublishedSite, publicSiteContext } from "../../_lib/public-site";
import { siteSitemap } from "@/lib/site-sitemap";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { site, posts } = await loadPublishedSite(slug);
  const context = await publicSiteContext(slug);
  return new Response(siteSitemap(site, posts, context.canonical), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}

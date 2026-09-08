import type { Post, Site } from "@araland/shared";

const xml = (value: string) => value.replace(/[<>&"']/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
export function siteSitemap(site: Site, posts: Post[], canonical: (path?: string) => string) {
  const pages = ["", ...(site.published?.pages ?? []).filter(page => page.enabled).map(page => `/${encodeURIComponent(page.slug)}`)];
  const urls = pages.map(path => `<url><loc>${xml(canonical(path))}</loc>${site.publishedAt ? `<lastmod>${xml(site.publishedAt)}</lastmod>` : ""}</url>`);
  for (const post of posts.filter(post => post.published)) urls.push(`<url><loc>${xml(canonical(`/blog/${encodeURIComponent(post.slug)}`))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}

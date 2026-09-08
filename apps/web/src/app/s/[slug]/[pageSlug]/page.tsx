import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { loadPublishedPage, publicSiteContext } from "../../_lib/public-site";

type Props = { params: Promise<{ slug: string; pageSlug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const { site, page } = await loadPublishedPage(slug, pageSlug);
  const context = await publicSiteContext(slug);
  const title = page.seo.title || `${page.title} | ${site.name}`;
  const description = page.seo.description;
  const image = page.sections.find((section) => section.enabled && section.type === "hero")?.image;
  const canonical = context.canonical(`/${encodeURIComponent(page.slug)}`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      url: canonical,
      ...(image ? { images: [{ url: context.asset(image), alt: page.title }] } : {}),
    },
  };
}

export default async function SiteDetailPage({ params }: Props) {
  const { slug, pageSlug } = await params;
  const { site, page, forms, posts } = await loadPublishedPage(slug, pageSlug);
  const { siteBasePath } = await publicSiteContext(slug);
  return <LandingPage site={site} forms={forms} posts={posts} pageId={page.id} siteBasePath={siteBasePath} />;
}

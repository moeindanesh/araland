import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { loadPublishedSite, publicSiteContext } from "../_lib/public-site";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { site } = await loadPublishedSite(slug);
  const context = await publicSiteContext(slug);
  const title = site.seo.title || site.name;
  const image = site.published?.sections.find(
    (section) => section.enabled && section.type === "hero",
  )?.image;
  return {
    title: { absolute: title },
    description: site.seo.description,
    alternates: { canonical: context.canonical() },
    openGraph: {
      title,
      description: site.seo.description,
      type: "website",
      locale: "fa_IR",
      url: context.canonical(),
      ...(image ? { images: [{ url: context.asset(image), alt: title }] } : {}),
    },
  };
}
export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const { site, forms, posts } = await loadPublishedSite(slug);
  const { siteBasePath } = await publicSiteContext(slug);
  return <LandingPage site={site} forms={forms} posts={posts} siteBasePath={siteBasePath} />;
}

import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { loadPublishedSite } from "../_lib/public-site";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { site } = await loadPublishedSite(slug);
  const title = site.seo.title || site.name;
  const image = site.published?.sections.find(
    (section) => section.type === "hero",
  )?.image;
  return {
    title: { absolute: title },
    description: site.seo.description,
    openGraph: {
      title,
      description: site.seo.description,
      type: "website",
      locale: "fa_IR",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
  };
}
export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const { site, forms, posts } = await loadPublishedSite(slug);
  return <LandingPage site={site} forms={forms} posts={posts} />;
}

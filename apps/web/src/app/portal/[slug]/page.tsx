import { Portal } from "@/components/portal";
import { loadPublishedSite } from "../../s/_lib/public-site";
export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await loadPublishedSite(slug);
  return <Portal slug={slug} />;
}

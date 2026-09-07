import { Portal } from "@/components/portal";
export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <Portal slug={(await params).slug} />;
}

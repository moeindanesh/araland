import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createDemoSite, templates, type TemplateId } from "@araland/shared";
import { LandingPage } from "@/components/landing-page";
type Props = { params: Promise<{ template: string }> };
function selectedTemplate(id: string) {
  const template = templates.find((template) => template.id === id);
  if (!template) notFound();
  return template;
}
export function generateStaticParams() {
  return templates.map((template) => ({ template: template.id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = selectedTemplate((await params).template);
  return {
    title: `پیش‌نمایش قالب ${template.name}`,
    description: template.description,
    robots: { index: false, follow: false },
  };
}
export default async function PreviewPage({ params }: Props) {
  const template = selectedTemplate((await params).template);
  return (
    <LandingPage site={createDemoSite(template.id as TemplateId)} preview />
  );
}

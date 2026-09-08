import type { Section, SectionType, SiteContent } from "@araland/shared";

/** Composition varies by template; content and link semantics stay shared. */
export type TemplateSectionProps = {
  section: Section;
  content: SiteContent;
  anchors: Partial<Record<SectionType, string>>;
  resolveLink: (url?: string, pageId?: string) => string;
};

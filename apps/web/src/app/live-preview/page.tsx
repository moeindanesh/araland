"use client";
import { useEffect, useState } from "react";
import { Site, SiteForm, Post } from "@araland/shared";
import { LandingPage } from "@/components/landing-page";
export default function LivePreview() {
  const [site, setSite] = useState<Site | null>(null);
  const [resources, setResources] = useState<{
    forms: SiteForm[];
    posts: Post[];
  }>({ forms: [], posts: [] });
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === window.parent &&
        event.data?.type === "araland-preview" &&
        event.data.site?.draft?.sections
      ) {
        setSite(event.data.site);
        setResources({
          forms: Array.isArray(event.data.forms) ? event.data.forms : [],
          posts: Array.isArray(event.data.posts) ? event.data.posts : [],
        });
      }
    };
    window.addEventListener("message", handler);
    window.parent.postMessage(
      { type: "araland-preview-ready" },
      location.origin,
    );
    return () => window.removeEventListener("message", handler);
  }, []);
  return site ? (
    <LandingPage
      site={site}
      forms={resources.forms}
      posts={resources.posts}
      preview
      embedded
    />
  ) : (
    <p role="status">در حال آماده‌سازی پیش‌نمایش…</p>
  );
}

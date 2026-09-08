"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowUpLeft, Menu, X } from "lucide-react";
import type { Site, SiteContent } from "@araland/shared";
import { createSiteLinks } from "@/lib/site-links";
import { templateIdentity } from "./templates/identity";

type ChromeProps = {
  site: Site;
  content: SiteContent;
  siteBasePath: string;
  pageId?: string;
  hasPosts?: boolean;
  preview?: boolean;
  awayFromHome?: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function PublicSiteHeader({ site, content, siteBasePath, pageId, hasPosts, awayFromHome = !!pageId, onNavigate }: ChromeProps) {
  const identity = templateIdentity[site.templateId];
  const [menu, setMenu] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuLinks = useRef<HTMLDivElement>(null);
  const links = createSiteLinks(content, siteBasePath, pageId, hasPosts, awayFromHome);
  const currentHref = awayFromHome ? (pageId ? links.pageHref(pageId) : undefined) : links.homeHref;
  const items = links.menu("header").map((item) => ({
    ...item,
    label: !content.navigation && item.id in identity.menu
      ? identity.menu[item.id as keyof typeof identity.menu]
      : item.label,
  }));
  useEffect(() => {
    if (!menu) return;
    menuLinks.current?.querySelector("a")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);
  return (
    <nav className="landing-nav" aria-label="فهرست اصلی سایت">
      <a href={links.homeHref} className="landing-logo" onClick={onNavigate}>
        {content.brand.logo ? <img className="landing-brand-image" src={content.brand.logo} alt="" width={44} height={44} /> : <span className="landing-symbol" aria-hidden="true">
          {identity.symbol}
        </span>}
        <span className="identity-brand-name">{content.brand.name}<small>{content.brand.tagline}</small></span>
      </a>
      <div ref={menuLinks} id={menuId} className={`landing-links ${menu ? "open" : ""}`}>
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            aria-current={item.href === currentHref ? "page" : undefined}
            onClick={(event) => { setMenu(false); onNavigate?.(event); }}
          >
            {item.label}
          </a>
        ))}
      </div>
      {links.homeAnchors.contact && (
        <a className="landing-nav-cta" href={links.homeAnchors.contact} onClick={onNavigate}>
          {identity.action} <ArrowUpLeft size={17} />
        </a>
      )}
      {items.length > 0 && (
        <button
          ref={menuButton}
          type="button"
          className="landing-menu icon-btn"
          aria-label={menu ? "بستن فهرست" : "نمایش فهرست"}
          aria-expanded={menu}
          aria-controls={menuId}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      )}
    </nav>
  );
}

export function PublicSiteFooter({ site, content, siteBasePath, pageId, hasPosts, preview, awayFromHome = !!pageId, onNavigate }: ChromeProps) {
  const links = createSiteLinks(content, siteBasePath, pageId, hasPosts, awayFromHome);
  const identity = templateIdentity[site.templateId];
  return (
    <footer className="landing-footer identity-footer">
      <div className="identity-footer-signoff"><span aria-hidden="true">{identity.symbol}</span><p>{identity.footer}</p></div>
      <div className="identity-footer-brand">
        <a href={links.homeHref} className="landing-logo" onClick={onNavigate}>
          {content.brand.name}
        </a>
        <p>{content.brand.tagline}</p>
      </div>
      <div className="identity-footer-meta">
        <nav className="landing-footer-links" aria-label="فهرست پایین سایت">
          {links.menu("footer").map((item) => (
            <a key={item.id} href={item.href} onClick={onNavigate}>
              {item.label} <ArrowUpLeft size={16} />
            </a>
          ))}
        </nav>
        {!preview && <Link href={siteBasePath ? `/portal/${site.slug}` : "/portal"}>پنل اختصاصی شما</Link>}
        <span>با عشق ساخته شده، با <Link href="/">آرالند</Link></span>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpLeft } from "lucide-react";
import { loadPublishedSite } from "../../../_lib/public-site";
import styles from "./article.module.css";

type Props = { params: Promise<{ slug: string; postSlug: string }> };
export const dynamic = "force-dynamic";
async function loadArticle(params: Props["params"]) {
  const { slug, postSlug } = await params;
  const { site, posts } = await loadPublishedSite(slug);
  const post = posts.find((post) => post.slug === postSlug && post.published);
  if (!post) notFound();
  return { site, post };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site, post } = await loadArticle(params);
  return {
    title: { absolute: `${post.title} | ${site.name}` },
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      locale: "fa_IR",
      publishedTime: post.createdAt,
      ...(post.cover ? { images: [{ url: post.cover, alt: post.title }] } : {}),
    },
  };
}
export default async function ArticlePage({ params }: Props) {
  const { site, post } = await loadArticle(params);
  const content = site.published!;
  return (
    <div
      className={`${styles.page} ${site.templateId === "forma" ? styles.dark : site.templateId === "bloom" ? styles.soft : ""}`}
      style={
        {
          "--article-accent": content.brand.primaryColor,
        } as React.CSSProperties
      }
    >
      <nav className={styles.nav}>
        <Link href={`/s/${site.slug}`} className={styles.brand}>
          {content.brand.name}
          <span>®</span>
        </Link>
        <Link href={`/s/${site.slug}#blog`}>
          بازگشت به خواندنی‌ها <ArrowRight size={18} />
        </Link>
      </nav>
      <article className={styles.article}>
        <header>
          <span className={styles.eyebrow}>از دفتر {content.brand.name}</span>
          <h1>{post.title}</h1>
          <p className={styles.excerpt}>{post.excerpt}</p>
          <div className={styles.meta}>
            <time dateTime={post.createdAt}>
              {new Date(post.createdAt).toLocaleDateString("fa-IR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Tehran",
              })}
            </time>
            <span>·</span>
            <span>
              {Math.max(
                1,
                Math.ceil(post.body.split(/\s+/).length / 180),
              ).toLocaleString("fa-IR")}{" "}
              دقیقه مطالعه
            </span>
          </div>
        </header>
        {post.cover && (
          <figure className={styles.cover}>
            <img src={post.cover} alt={post.title} />
          </figure>
        )}
        <div className={styles.body}>
          {post.body
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
        <aside className={styles.cta}>
          <div>
            <span>این گفتگو ادامه دارد</span>
            <h2>از یک ایده، به یک شروع تازه.</h2>
          </div>
          <Link href={`/s/${site.slug}#contact`}>
            با ما در ارتباط باشید <ArrowUpLeft size={21} />
          </Link>
        </aside>
      </article>
      <footer className={styles.footer}>
        <span>{content.brand.name}</span>
        <Link href={`/s/${site.slug}`}>
          بازگشت به سایت <ArrowRight size={16} />
        </Link>
      </footer>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteFile } from "@araland/shared";
import {
  FolderLock,
  Download,
  FileText,
  ShieldCheck,
  ArrowUpLeft,
} from "lucide-react";
import { Brand, Button, Notice, Empty } from "./ui";
import {
  portalRequest,
  json,
  getPortalToken,
  portalTokenKey,
  baseUrl,
  date,
  fa,
} from "@/lib/client";
export function Portal({ slug }: { slug: string }) {
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    if (!getPortalToken(slug)) {
      setLoading(false);
      return;
    }
    setAuthenticated(true);
    portalRequest(slug, `/public/sites/${slug}/join`, json({}))
      .then(() =>
        portalRequest<{ site: { name: string }; files: SiteFile[] }>(
          slug,
          `/portal/${slug}`,
        ),
      )
      .then((data) => {
        setFiles(data.files);
        setName(data.site.name);
      })
      .catch((e) => {
        setError(e.message);
        if (/ورود|نشست|401|توکن/.test(e.message)) {
          localStorage.removeItem(portalTokenKey(slug));
          setAuthenticated(false);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);
  async function download(file: SiteFile) {
    try {
      const response = await fetch(`${baseUrl}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${getPortalToken(slug)}` },
      });
      if (!response.ok)
        throw new Error("فایل در دسترس نیست یا مجوز دریافت ندارید.");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="portal-page">
      <header>
        <Brand />
        {authenticated && (
          <Button
            className="btn-outline btn-small"
            onClick={async () => {
              try {
                await portalRequest(slug, "/auth/logout", json({}));
              } finally {
                localStorage.removeItem(portalTokenKey(slug));
                setFiles([]);
                setAuthenticated(false);
                setError("");
              }
            }}
          >
            خروج از پنل
          </Button>
        )}
        <Link href={`/s/${slug}`}>
          بازگشت به سایت <ArrowUpLeft size={17} />
        </Link>
      </header>
      <main>
        <div className="portal-heading">
          <span className="portal-icon">
            <FolderLock size={30} />
          </span>
          <span className="eyebrow">یک فضای امن، مخصوص شما</span>
          <h1>
            {name ? `پنل اختصاصی ${name}` : "به پنل اختصاصی خودتان خوش آمدید"}
          </h1>
          <p>
            فایل‌هایی که برای شماره موبایل شما ارسال شده‌اند، اینجا در
            دسترس‌اند.
          </p>
        </div>
        <Notice message={error} error />
        {loading ? (
          <Empty title="در حال آماده‌سازی پنل…" description="" />
        ) : !authenticated ? (
          <div className="panel">
            <Empty
              title="با شماره موبایل خود وارد شوید"
              description="برای دیدن فایل‌ها، با همان شماره‌ای وارد شوید که به کسب‌وکار داده‌اید."
            >
              <Link
                className="btn"
                href={`/login?returnTo=${encodeURIComponent(`/portal/${slug}`)}`}
              >
                ورود امن با پیامک <ArrowUpLeft size={18} />
              </Link>
            </Empty>
          </div>
        ) : files.length ? (
          <div className="portal-files">
            {files.map((file) => (
              <article key={file.id} className="panel">
                <span className="resource-icon">
                  <FileText size={27} />
                </span>
                <h3>{file.title}</h3>
                <p>{file.originalName}</p>
                <small>
                  {date(file.createdAt)} · {fa(Math.ceil(file.size / 1024))}{" "}
                  کیلوبایت
                </small>
                <Button className="btn-outline" onClick={() => download(file)}>
                  <Download size={17} />
                  دریافت فایل
                </Button>
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="panel">
            <Empty
              title="هنوز فایلی برای شما ارسال نشده"
              description="به‌محض اینکه کسب‌وکار فایلی برای شماره شما قرار دهد، اینجا نمایش داده می‌شود."
            />
          </div>
        ) : null}
        <div className="portal-security">
          <ShieldCheck size={16} />
          فقط شما و صاحب کسب‌وکار به این فایل‌ها دسترسی دارید.
        </div>
      </main>
    </div>
  );
}

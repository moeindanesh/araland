"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError, SiteFile } from "@araland/shared";
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
  const [refresh, setRefresh] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setFiles([]);
    setName("");
    setError("");
    setLoading(true);
    setAuthenticated(false);
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
        if (current !== generation.current) return;
        setFiles(data.files);
        setName(data.site.name);
      })
      .catch((e) => {
        if (current !== generation.current) return;
        setError(e.message);
        if (e instanceof ApiError && e.status === 401) {
          localStorage.removeItem(portalTokenKey(slug));
          setAuthenticated(false);
        }
      })
      .finally(() => { if (current === generation.current) setLoading(false); });
    return () => { generation.current += 1; };
  }, [slug, refresh]);
  async function download(file: SiteFile) {
    if (downloading || loggingOut) return;
    setDownloading(file.id);
    setError("");
    try {
      const response = await fetch(`${baseUrl}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${getPortalToken(slug)}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error("فایل در دسترس نیست یا مجوز دریافت ندارید.");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading(null);
    }
  }
  return (
    <div className="portal-page">
      <header>
        <Brand />
        {authenticated && (
          <Button
            className="btn-outline btn-small"
            disabled={loggingOut}
            onClick={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              generation.current += 1;
              try {
                await portalRequest(slug, "/auth/logout", json({}));
              } catch {
                // Local logout still completes when the server cannot revoke the session.
              } finally {
                localStorage.removeItem(portalTokenKey(slug));
                setFiles([]);
                setAuthenticated(false);
                setError("");
                setName("");
                setLoading(false);
                setLoggingOut(false);
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
        {authenticated && !loading && <Button className="btn-outline btn-small" disabled={loggingOut || !!downloading} onClick={() => setRefresh(value => value + 1)}>تازه‌سازی فایل‌ها</Button>}
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
                <Button className="btn-outline" disabled={!!downloading || loggingOut} onClick={() => download(file)}>
                  <Download size={17} />
                  {downloading === file.id ? "در حال دریافت…" : "دریافت فایل"}
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

import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";

function configuredAppHosts() {
  const configured = [
    process.env.APP_HOST,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_HOSTS,
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(","));
  return new Set(
    configured.map((value) => {
      try {
        return new URL(
          value.includes("://") ? value : `https://${value.trim()}`,
        ).hostname.toLowerCase();
      } catch {
        return "";
      }
    }),
  );
}
function message(status: number, title: string, description: string) {
  return new NextResponse(
    `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f4ee;color:#284c3e;font-family:Tahoma,sans-serif"><main style="max-width:440px;padding:30px;text-align:center"><h1 style="font-size:25px;line-height:1.8">${title}</h1><p style="font-size:14px;line-height:2.2;color:#73826c">${description}</p></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        ...(status === 503 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isIP(hostname) ||
    configuredAppHosts().has(hostname)
  )
    return NextResponse.next();
  const base = (
    process.env.API_INTERNAL_URL || "http://localhost:4000/api"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(
      `${base}/public/domain/${encodeURIComponent(hostname)}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
  } catch {
    return message(
      503,
      "ارتباط با سایت برقرار نشد",
      "سرویس سایت موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    );
  }
  if (response.status === 404)
    return message(
      404,
      "این دامنه هنوز فعال نیست",
      "این دامنه به یک سایت منتشرشده متصل نشده است.",
    );
  if (!response.ok)
    return message(
      503,
      "ارتباط با سایت برقرار نشد",
      "سرویس سایت موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    );
  const data = (await response.json().catch(() => null)) as {
    slug?: string;
  } | null;
  if (!data?.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
    return message(
      503,
      "ارتباط با سایت برقرار نشد",
      "کمی بعد دوباره تلاش کنید.",
    );
  const slug = data.slug;
  const path = request.nextUrl.pathname;
  const destination = request.nextUrl.clone();
  // Client components retain canonical platform paths; only this domain's site is allowed.
  if (
    path === `/s/${slug}` ||
    path.startsWith(`/s/${slug}/blog/`) ||
    path === `/portal/${slug}` ||
    path === "/login"
  )
    return NextResponse.next();
  if (path === "/") {
    destination.pathname = `/s/${slug}`;
    return NextResponse.rewrite(destination);
  }
  if (path.startsWith("/blog/")) {
    destination.pathname = `/s/${slug}${path}`;
    return NextResponse.rewrite(destination);
  }
  if (path === "/portal") {
    destination.pathname = `/portal/${slug}`;
    return NextResponse.rewrite(destination);
  }
  return message(
    404,
    "این صفحه پیدا نشد",
    "آدرس صفحه را بررسی کنید یا به صفحه اصلی سایت برگردید.",
  );
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts/|images/|api/).*)",
  ],
};

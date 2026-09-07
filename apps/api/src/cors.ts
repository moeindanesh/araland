import { db } from "@araland/db";

export async function allowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081"
  )
    .split(",")
    .map((value) => value.trim());
  if (allowed.includes(origin)) return origin;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (
    url.origin !== origin ||
    (url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) ||
    url.port
  )
    return false;
  const domain = await db.domain.findFirst({
    where: {
      hostname: url.hostname.toLowerCase(),
      status: "VERIFIED",
      site: { status: "PUBLISHED" },
    },
    select: { id: true },
  });
  return domain ? origin : false;
}

// Browser origins hosted by a business only receive that site's portal scope.
export async function requestSiteScope(
  request: Request,
): Promise<string | null> {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081"
  )
    .split(",")
    .map((value) => value.trim());
  if (allowed.includes(origin)) return null;
  if (!(await allowOrigin(request))) throw new Error("UNTRUSTED_ORIGIN");
  const domain = await db.domain.findFirst({
    where: {
      hostname: new URL(origin).hostname.toLowerCase(),
      status: "VERIFIED",
      site: { status: "PUBLISHED" },
    },
    select: { siteId: true },
  });
  if (!domain) throw new Error("UNTRUSTED_ORIGIN");
  return domain.siteId;
}

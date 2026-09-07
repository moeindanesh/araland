import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function assert(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const ephemeralSecret = randomBytes(32).toString('hex');
export const otpHash = (id: string, code: string) => createHmac('sha256', process.env.AUTH_SECRET || ephemeralSecret).update(`${id}:${code}`).digest('hex');
export const equalHash = (left: string, right: string) => left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));
export function normalizePhone(value: string) {
  let phone = value.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[\s()-]/g, '');
  if (phone.startsWith('0098')) phone = `+98${phone.slice(4)}`;
  if (/^09\d{9}$/.test(phone)) phone = `+98${phone.slice(1)}`;
  if (/^9\d{9}$/.test(phone)) phone = `+98${phone}`;
  assert(/^\+989\d{9}$/.test(phone), 400, 'شماره موبایل معتبر ایران وارد کنید.');
  return phone;
}
const counters = new Map<string, { count: number; expires: number }>();
export function rateLimit(key: string, limit: number, seconds: number) {
  const now = Date.now();
  if (counters.size > 10_000) for (const [key, value] of counters) if (value.expires <= now) counters.delete(key);
  const previous = counters.get(key);
  const next = !previous || previous.expires <= now ? {count: 1, expires: now + seconds * 1000} : {count: previous.count + 1, expires: previous.expires};
  counters.set(key, next);
  assert(next.count <= limit, 429, 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.');
}
export function requestIp(request: Request, server?: { requestIP(request: Request): {address: string} | null } | null) {
  if (process.env.TRUST_PROXY === 'true') return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return server?.requestIP(request)?.address || 'local';
}
export const isDevAuth = () => process.env.AUTH_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production';
export async function sendOtp(phone: string, code: string) {
  if (isDevAuth()) return;
  const key = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;
  assert(key && template, 503, 'سرویس پیامک هنوز پیکربندی نشده است.');
  const url = new URL(`https://api.kavenegar.com/v1/${key}/verify/lookup.json`);
  url.searchParams.set('receptor', `0${phone.slice(3)}`);
  url.searchParams.set('token', code);
  url.searchParams.set('template', template);
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(15_000)});
    const result = await response.json() as {return?: {status?: number}};
    assert(response.ok && result.return?.status === 200, 503, 'ارسال پیامک انجام نشد. دوباره تلاش کنید.');
  } catch { throw new HttpError(503, 'ارسال پیامک انجام نشد. دوباره تلاش کنید.'); }
}

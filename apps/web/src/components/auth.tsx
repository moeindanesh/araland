"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { templates } from "@araland/shared";
import { ArrowUpLeft, Smartphone, ShieldCheck, Check } from "lucide-react";
import { Brand, Button, ActionButton, Input, Notice } from "./ui";
import { request, json, portalTokenKey } from "@/lib/client";

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
}

function normalizeMobile(value: string) {
  let normalized = normalizeDigits(value).replace(/[\s()-]/g, "");
  if (normalized.startsWith("0098")) normalized = `+98${normalized.slice(4)}`;
  if (/^09\d{9}$/.test(normalized)) normalized = `+98${normalized.slice(1)}`;
  if (/^9\d{9}$/.test(normalized)) normalized = `+98${normalized}`;
  return /^\+989\d{9}$/.test(normalized) ? normalized : "";
}

function safeReturnPath(value: string | null, origin: string) {
  if (!value?.startsWith("/")) return "/";
  try {
    const destination = new URL(value, origin);
    if (
      destination.origin === origin &&
      destination.pathname.replace(/\/+$/, "") !== "/login"
    )
      return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    // Invalid return paths keep the default manager destination.
  }
  return "/";
}

function loginError(error: unknown) {
  if (
    error instanceof Error &&
    ["SecurityError", "QuotaExceededError"].includes(error.name)
  )
    return "مرورگر اجازه ذخیره ورود را نمی‌دهد. دسترسی به حافظه سایت را بررسی کن.";
  if (
    error instanceof TypeError ||
    (error instanceof Error && error.name === "AbortError")
  )
    return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.";
  return error instanceof Error
    ? error.message
    : "ورود انجام نشد. دوباره تلاش کن.";
}

async function authRequest<T>(path: string, body: unknown) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  try {
    return await request<T>(path, { ...json(body), signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function Auth() {
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState("");
  const [devCode, setDevCode] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const requestInFlight = useRef(false);
  const phoneInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const expiryId = useId();
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<"phone" | "code">();
  const [retryAt, setRetryAt] = useState(0);
  const [requestedPhone, setRequestedPhone] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(0);
  const [returnTo, setReturnTo] = useState("/");
  const normalizedPhone = normalizeMobile(phone);
  const countdown =
    normalizedPhone === requestedPhone
      ? Math.max(0, Math.ceil((retryAt - now) / 1000))
      : 0;
  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const expired = Boolean(challenge && expiresAt && !expiresIn);
  const portalSlug = returnTo.match(
    /^\/portal\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:[?#]|$)/,
  )?.[1];
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setReturnTo(safeReturnPath(query.get("returnTo"), location.origin));
  }, []);
  useEffect(() => {
    if (!retryAt && !expiresAt) return;
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [retryAt, expiresAt]);
  useEffect(() => {
    if (!busy) (challenge ? codeInput.current : phoneInput.current)?.focus();
  }, [busy, challenge]);
  async function sendCode() {
    if (requestInFlight.current || countdown > 0) return;
    if (!normalizedPhone) {
      setError("شماره موبایل معتبر ایران وارد کن؛ مثلاً ۰۹۱۲۳۴۵۶۷۸۹.");
      setInvalidField("phone");
      phoneInput.current?.focus();
      return;
    }
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    setInvalidField(undefined);
    try {
      const result = await authRequest<{
        challengeId: string;
        expiresIn: number;
        devCode?: string;
      }>("/auth/request", {
        ...(portalSlug ? { siteSlug: portalSlug } : {}),
        phone: normalizedPhone,
      });
      setChallenge(result.challengeId);
      setDevCode(result.devCode || "");
      const receivedAt = Date.now();
      setNow(receivedAt);
      setRequestedPhone(normalizedPhone);
      setRetryAt(receivedAt + 60_000);
      setExpiresAt(receivedAt + result.expiresIn * 1000);
      setCode("");
    } catch (e) {
      setError(loginError(e));
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-main">
        <div className="auth-top">
          <Brand />
          <Link href={portalSlug ? `/s/${portalSlug}` : "/"}>
            {portalSlug ? "بازگشت به سایت" : "بازگشت"}
            <ArrowUpLeft size={16} />
          </Link>
        </div>
        <div className="auth-card">
          <span className="auth-icon">
            <Smartphone size={29} />
          </span>
          <span className="eyebrow">یک شروع تازه، برای ایده تو</span>
          <h1>
            {challenge
              ? "یک قدم تا ورود"
              : portalSlug
                ? "ورود به پنل اختصاصی شما"
                : "به آرالند خوش اومدی."}
          </h1>
          <p>
            {challenge ? (
              <>
                کد ارسال‌شده به <bdi dir="ltr">{phone}</bdi> را وارد کن.
              </>
            ) : portalSlug ? (
              "برای دریافت فایل‌ها، با شماره موبایل خودتان وارد شوید."
            ) : (
              "شماره موبایلت رو وارد کن؛ سایت بعدی تو از همین‌جا شروع می‌شه."
            )}
          </p>
          <form
            className="stack-form"
            aria-busy={busy}
            onSubmit={async (e) => {
              e.preventDefault();
              if (requestInFlight.current) return;
              if (!challenge) {
                await sendCode();
                return;
              }
              if (expired) {
                setError("اعتبار این کد تمام شده است. کد تازه‌ای دریافت کن.");
                return;
              }
              if (!/^\d{6}$/.test(code)) {
                setError("کد تایید باید شش رقم باشد.");
                setInvalidField("code");
                codeInput.current?.focus();
                return;
              }
              requestInFlight.current = true;
              setBusy(true);
              setError("");
              setInvalidField(undefined);
              let redirecting = false;
              try {
                const data = await authRequest<{
                  token: string;
                  siteSlug?: string | null;
                  siteScopeId?: string | null;
                }>("/auth/verify", {
                  challengeId: challenge,
                  code,
                });
                const scopedSlug = data.siteSlug || portalSlug;
                try {
                  localStorage.setItem(
                    scopedSlug ? portalTokenKey(scopedSlug) : "araland-token",
                    data.token,
                  );
                } catch {
                  throw new Error(
                    "مرورگر اجازه ذخیره ورود را نمی‌دهد. دسترسی به حافظه سایت را فعال کن و کد تازه‌ای دریافت کن.",
                  );
                }
                const template = new URLSearchParams(location.search).get(
                  "template",
                );
                if (
                  template &&
                  templates.some((item) => item.id === template)
                ) {
                  try {
                    localStorage.setItem(
                      "araland-preferred-template",
                      template,
                    );
                  } catch {
                    // An optional template preference must not block a saved session.
                  }
                }
                location.href = scopedSlug ? `/portal/${scopedSlug}` : returnTo;
                redirecting = true;
              } catch (err) {
                const message = loginError(err);
                setError(message);
                if (/کد ورود نامعتبر/.test(message)) setInvalidField("code");
              } finally {
                if (!redirecting) {
                  requestInFlight.current = false;
                  setBusy(false);
                }
              }
            }}
          >
            {challenge ? (
              <>
                <label>
                  کد تایید
                  <Input
                    ref={codeInput}
                    className="otp-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="کد تایید"
                    disabled={busy || expired}
                    value={code}
                    onChange={(e) => {
                      setCode(
                        normalizeDigits(e.target.value)
                          .replace(/\D/g, "")
                          .slice(0, 6),
                      );
                      if (invalidField === "code") {
                        setInvalidField(undefined);
                        setError("");
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = normalizeDigits(
                        e.clipboardData.getData("text"),
                      ).replace(/\D/g, "");
                      if (!pasted) return;
                      e.preventDefault();
                      setCode(pasted.slice(0, 6));
                      setInvalidField(undefined);
                      setError("");
                    }}
                    aria-invalid={invalidField === "code" || undefined}
                    aria-describedby={`${expiryId}${error ? ` ${errorId}` : ""}`}
                    required
                    pattern="[0-9]{6}"
                    title="کد تایید شش‌رقمی را وارد کن."
                    enterKeyHint="done"
                    minLength={6}
                    maxLength={6}
                    autoFocus
                    dir="ltr"
                    placeholder="— — — — — —"
                  />
                </label>
                <p
                  id={expiryId}
                  className="muted"
                  role={expired ? "status" : undefined}
                >
                  {expired
                    ? "اعتبار کد تمام شده است؛ کد تازه‌ای دریافت کن."
                    : `اعتبار کد: ${Math.floor(expiresIn / 60).toLocaleString("fa-IR")}:${(expiresIn % 60).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}`}
                </p>
                {devCode && (
                  <div className="dev-code">
                    <ShieldCheck size={17} />
                    <div>
                      <b>محیط توسعه · پیامک واقعی ارسال نشده</b>
                      <span>
                        کد آزمایشی این درخواست:{" "}
                        <strong dir="ltr">{devCode}</strong>
                      </span>
                    </div>
                    <ActionButton
                      type="button"
                      disabled={busy || expired}
                      onClick={() => {
                        setCode(devCode);
                        setInvalidField(undefined);
                        setError("");
                        codeInput.current?.focus();
                      }}
                    >
                      درج کد
                    </ActionButton>
                  </div>
                )}
                <div className="otp-actions">
                  <ActionButton
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (requestInFlight.current) return;
                      setChallenge("");
                      setCode("");
                      setError("");
                      setInvalidField(undefined);
                      setDevCode("");
                      setExpiresAt(0);
                    }}
                  >
                    ویرایش شماره
                  </ActionButton>
                  <ActionButton
                    type="button"
                    onClick={sendCode}
                    disabled={countdown > 0 || busy}
                  >
                    {countdown > 0
                      ? `${countdown.toLocaleString("fa-IR")} ثانیه تا ارسال دوباره`
                      : "ارسال دوباره کد"}
                  </ActionButton>
                </div>
              </>
            ) : (
              <label>
                شماره موبایل
                <Input
                  ref={phoneInput}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="0912 345 6789"
                  required
                  maxLength={30}
                  enterKeyHint="send"
                  disabled={busy}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (invalidField === "phone") {
                      setInvalidField(undefined);
                      setError("");
                    }
                  }}
                  aria-invalid={invalidField === "phone" || undefined}
                  aria-describedby={error ? errorId : undefined}
                  autoFocus
                />
              </label>
            )}
            <Notice id={errorId} message={error} error />
            <Button
              loading={busy}
              disabled={challenge ? expired : countdown > 0}
              type="submit"
            >
              {challenge
                ? portalSlug
                  ? "ورود به پنل سایت"
                  : "ورود به فضای من"
                : countdown > 0
                  ? `${countdown.toLocaleString("fa-IR")} ثانیه تا دریافت کد تازه`
                  : "دریافت کد ورود"}
              <ArrowUpLeft size={19} />
            </Button>
          </form>
          <p className="auth-privacy">
            <ShieldCheck size={15} />
            شماره‌ات فقط برای ورود امن و مدیریت حسابت استفاده می‌شود.
          </p>
        </div>
        <div className="auth-footer">
          با یک ایده شروع کن. با آرالند رشد کن.<span>© آرا‌لند ۲۰۲۶</span>
        </div>
      </div>
      <aside className="auth-story">
        <div className="auth-story-orbit" />
        <span className="auth-spark">✳</span>
        <span className="auth-story-label">YOUR NEXT BIG THING</span>
        <h2>
          یک ایده داری.
          <br />
          یک دنیا
          <br />
          <em>منتظر توست.</em>
        </h2>
        <p>
          خانه دیجیتال کسب‌وکارت را بساز.
          <br />
          از هرجا مدیریت کن. به آدم‌های بیشتری برس.
        </p>
        <div className="auth-story-card">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=85"
            alt="فضایی برای شروع یک داستان تازه"
          />
          <div>
            <span>یک طراحی خوب، یک شروع متفاوت.</span>
            <ArrowUpLeft size={26} />
          </div>
        </div>
        <div className="auth-points">
          <span>
            <Check size={14} />
            بدون نیاز به کدنویسی
          </span>
          <span>
            <Check size={14} />
            مدیریت از گوشی
          </span>
          <span>
            <Check size={14} />
            طراحی به سلیقه تو
          </span>
        </div>
      </aside>
    </div>
  );
}

"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="route-feedback">
    <div><h1>دریافت صفحه انجام نشد</h1>
      <p>ارتباط با سرویس موقتاً برقرار نیست. کمی بعد دوباره تلاش کنید.</p>
      <button className="btn" type="button" onClick={reset}>تلاش دوباره</button>
    </div>
  </main>;
}

import Link from "next/link";

export default function NotFound() {
  return <main className="route-feedback">
    <div><span className="eyebrow">۴۰۴</span><h1>این صفحه پیدا نشد</h1>
      <p>ممکن است نشانی تغییر کرده باشد یا صفحه هنوز منتشر نشده باشد.</p>
      <Link className="btn" href="/">بازگشت به صفحه اصلی</Link>
    </div>
  </main>;
}

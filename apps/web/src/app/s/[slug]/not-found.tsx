export default function SiteNotFound() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f4ee",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <span style={{ fontSize: 13, letterSpacing: 4, color: "#91a07e" }}>
          404
        </span>
        <h1 style={{ fontSize: 28, color: "#284c3e", margin: "18px 0" }}>
          این صفحه در دسترس نیست
        </h1>
        <p style={{ fontSize: 15, lineHeight: 2, color: "#73826c" }}>
          ممکن است آدرس اشتباه باشد یا صاحب سایت هنوز این صفحه را منتشر نکرده
          باشد.
        </p>
      </div>
    </main>
  );
}

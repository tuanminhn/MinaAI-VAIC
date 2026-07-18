import Link from "next/link";

export default function Home() {
  return (
    <main className="shell hero">
      <div className="eyebrow">Kết nối tri thức · Toán 6–7</div>
      <h1>Tìm đúng lỗ hổng.<br />Giúp đúng lúc.</h1>
      <p className="hero-copy">
        Mina AI biến lỗi sai thành một hành động rõ ràng cho giáo viên và một lộ trình bù hổng ngắn cho học sinh.
      </p>
      <div className="hero-actions">
        <Link className="button primary" href="/teacher">Mở dashboard giáo viên</Link>
        <Link className="button secondary" href="/student">Trải nghiệm học sinh</Link>
      </div>
      <section className="flow-card" aria-label="Luồng demo">
        <div><strong>1</strong><span>Làm diagnostic</span></div>
        <div><strong>2</strong><span>Tìm nguyên nhân</span></div>
        <div><strong>3</strong><span>Bù hổng ngắn</span></div>
        <div><strong>4</strong><span>Quay lại bài chính</span></div>
      </section>
    </main>
  );
}

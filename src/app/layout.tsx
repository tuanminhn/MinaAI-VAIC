import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mina AI",
  description: "Co-teacher thích ứng cho lớp học Việt Nam",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">M</span>
            <span>Mina AI</span>
          </Link>
          <nav aria-label="Điều hướng chính">
            <Link href="/how-it-works">Cách hoạt động</Link>
            <Link href="/knowledge-base">Kho tri thức</Link>
            <Link href="/student">Học sinh</Link>
            <Link href="/teacher">Giáo viên</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/how-it-works", label: "Cách hoạt động" },
  { href: "/knowledge-base", label: "Kho tri thức" },
  { href: "/student", label: "Học sinh" },
  { href: "/teacher", label: "Giáo viên" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar">
      <Link className="brand" href="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">M</span>
        <span>Mina AI</span>
      </Link>

      <nav className="topbar-nav" aria-label="Điều hướng chính">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Đóng menu" : "Mở menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      <nav id="mobile-nav" className="mobile-nav" data-open={open} aria-label="Điều hướng di động">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

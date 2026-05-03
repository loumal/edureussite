"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--color-paper)]/95 backdrop-blur-md shadow-[0_1px_24px_rgba(15,22,35,0.07)] border-b border-[var(--color-rule)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-base font-black text-[var(--color-ink)] tracking-tight hover:opacity-75 transition-opacity"
        >
          ✦ Édu-Réussite QC
        </Link>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[var(--color-ink)] px-5 py-2 text-sm font-bold text-white hover:opacity-85 transition-opacity shadow-sm"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Burger mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[var(--color-paper-warm)] transition-colors"
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-rule)] bg-[var(--color-paper)] px-6 py-4 space-y-2">
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl border border-[var(--color-rule)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-ink)]"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl bg-[var(--color-ink)] px-4 py-3 text-center text-sm font-bold text-white"
          >
            Commencer gratuitement
          </Link>
        </div>
      )}
    </header>
  );
}

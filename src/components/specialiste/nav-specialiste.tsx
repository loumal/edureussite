"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function NavSpecialiste() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-rule)] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/specialiste" className="text-lg font-black text-[var(--color-ink)]">
          ✦ ÉduRéussite
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/specialiste" active={pathname === "/specialiste"}>Tableau de bord</NavLink>
          <NavLink href="/specialiste/agenda" active={pathname.startsWith("/specialiste/agenda")}>Agenda</NavLink>
          <NavLink href="/specialiste/demandes" active={pathname.startsWith("/specialiste/demandes")}>Demandes</NavLink>
        </div>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <span className="hidden rounded-full bg-[rgba(42,124,111,0.1)] px-3 py-1 text-xs font-semibold text-[var(--color-success)] sm:block">
            Spécialiste
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors md:block"
          >
            Se déconnecter
          </button>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-[var(--color-rule)] md:hidden"
            aria-label="Menu"
          >
            <span className={`h-0.5 w-5 rounded bg-[var(--color-ink)] transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 rounded bg-[var(--color-ink)] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 rounded bg-[var(--color-ink)] transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>

          {/* Dropdown mobile */}
          {menuOpen && (
            <div className="absolute right-0 top-13 z-50 w-56 rounded-xl border border-[var(--color-rule)] bg-white p-1 shadow-[var(--shadow-elevated)] md:hidden">
              <hr className="mb-1 border-[var(--color-rule)]" />
              <Link href="/specialiste" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                🏠 Tableau de bord
              </Link>
              <Link href="/specialiste/agenda" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                📅 Agenda
              </Link>
              <Link href="/specialiste/demandes" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                📋 Demandes
              </Link>
              <hr className="my-1 border-[var(--color-rule)]" />
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)]">
                🚪 Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href, active, children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}

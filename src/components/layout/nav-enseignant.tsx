"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavEnseignantProps {
  nom: string;
}

export function NavEnseignant({ nom }: NavEnseignantProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/enseignant" className="text-lg font-black text-[var(--color-ink)]">
          ✦ Édu-Réussite
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/enseignant" active={pathname === "/enseignant"}>Mes élèves</NavLink>
          <NavLink href="/enseignant/rapports" active={pathname.startsWith("/enseignant/rapports")}>Rapports</NavLink>
          {isAdmin && (
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>⚙️ Admin</NavLink>
          )}
        </div>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <div className="hidden rounded-full bg-[rgba(101,88,166,0.1)] px-3 py-1 text-xs font-semibold text-[var(--color-purple)] sm:block">
            Enseignant(e)
          </div>
          <span className="hidden text-sm font-medium text-[var(--color-ink-soft)] md:block">{nom}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors md:block"
          >
            Déconnexion
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
              <div className="px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                <span className="font-semibold text-[var(--color-ink)]">{nom}</span>
              </div>
              <hr className="my-1 border-[var(--color-rule)]" />
              <Link href="/enseignant" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                👥 Mes élèves
              </Link>
              <Link href="/enseignant/rapports" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                📊 Rapports
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                  ⚙️ Admin
                </Link>
              )}
              <hr className="my-1 border-[var(--color-rule)]" />
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)]">
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface NavAdminProps {
  role: string;
}

const NAV_LINKS = [
  { href: "/admin/epreuves", label: "Épreuves", emoji: "📋", exact: false },
];

const SUPER_ADMIN_LINKS = [
  { href: "/admin/utilisateurs", label: "Utilisateurs", emoji: "👥", exact: false },
  { href: "/admin/specialistes", label: "Spécialistes", emoji: "👩‍⚕️", exact: false },
  { href: "/admin/documents", label: "Docs IA", emoji: "📚", exact: false },
  { href: "/admin/agents", label: "Agents", emoji: "🤖", exact: false },
];

export function NavAdmin({ role }: NavAdminProps) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const allLinks = isSuperAdmin ? [...NAV_LINKS, ...SUPER_ADMIN_LINKS] : NAV_LINKS;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo + rôle */}
        <Link
          href="/admin"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-base font-black text-[var(--color-ink)]">✦ Édu-Réussite</span>
          <span className="rounded-full bg-[rgba(217,79,43,0.1)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-accent)] leading-tight">
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
        </Link>

        {/* Liens de navigation */}
        <div className="flex items-center gap-1">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.href, link.exact)
                  ? "bg-[var(--color-ink)] text-white"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span>{link.emoji}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}

          {/* Menu utilisateur */}
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                menuOpen
                  ? "bg-[var(--color-paper-warm)] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
              }`}
              title="Menu utilisateur"
            >
              <span>👤</span>
              <span
                className={`hidden sm:inline transition-transform duration-150 text-xs ${menuOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] shadow-lg overflow-hidden">
                <Link
                  href="/parent"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <span>👨‍👩‍👧</span>
                  <span>Espace parent</span>
                </Link>
                <div className="border-t border-[var(--color-rule)]" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)] transition-colors"
                >
                  <span>↩</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

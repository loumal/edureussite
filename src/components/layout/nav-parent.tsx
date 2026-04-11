"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

interface NavParentProps {
  nom: string;
  specialistesActif?: boolean;
}

export function NavParent({ specialistesActif }: NavParentProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: nonLues } = trpc.parent.countNotificationsNonLues.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: specialistesOn } = trpc.specialiste.isActive.useQuery(undefined, {
    initialData: specialistesActif ?? true,
    staleTime: 60_000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ferme le menu mobile au changement de route
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const links = [
    { href: "/parent", label: "Tableau de bord", emoji: "🏠" },
    { href: "/parent/rapports", label: "Rapports", emoji: "📊" },
    ...(specialistesOn ? [
      { href: "/parent/specialistes", label: "Spécialistes", emoji: "👩‍⚕️" },
      { href: "/parent/rendez-vous", label: "Rendez-vous", emoji: "📅" },
    ] : []),
    { href: "/parent/notifications", label: "Notifications", emoji: "🔔", badge: nonLues && nonLues > 0 ? nonLues : null },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-rule)] bg-white/90 backdrop-blur-sm" ref={menuRef}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/parent" className="text-lg font-black text-[var(--color-ink)]">
          ✦ ÉduRéussite
        </Link>

        {/* Navigation desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              active={link.href === "/parent" ? pathname === "/parent" : pathname.startsWith(link.href)}
            >
              <span className="flex items-center gap-1.5">
                {link.label}
                {link.badge ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Droite : badge + déconnexion + hamburger */}
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-[rgba(42,124,111,0.1)] px-3 py-1 text-xs font-semibold text-[var(--color-success)] sm:block">
            Parent
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors md:block"
          >
            Se déconnecter
          </button>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-rule)] bg-white px-4 py-3 md:hidden">
          <div className="space-y-1">
            {links.map((link) => {
              const active = link.href === "/parent" ? pathname === "/parent" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-ink)] text-white"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>{link.emoji}</span>
                    {link.label}
                  </span>
                  {link.badge ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <div className="border-t border-[var(--color-rule)] pt-2 mt-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)] transition-colors"
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
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

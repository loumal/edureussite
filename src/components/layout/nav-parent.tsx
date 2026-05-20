"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils/cn";

interface NavParentProps {
  nom?: string;
  specialistesActif?: boolean;
}

export function NavParent({ specialistesActif }: NavParentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const { data: nonLues } = trpc.parent.countNotificationsNonLues.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: specialistesOn } = trpc.specialiste.isActive.useQuery(undefined, {
    initialData: specialistesActif ?? true,
    staleTime: 60_000,
  });
  const { data: enfants = [] } = trpc.parent.getDashboard.useQuery(undefined, {
    staleTime: 120_000,
    select: (d) => d.eleves.map((e) => ({ id: e.id, prenom: e.prenom })),
  });

  const enfantId = searchParams.get("enfant");
  const activeEnfantId = enfantId ?? enfants[0]?.id ?? null;
  const enfantQ = activeEnfantId ? `?enfant=${activeEnfantId}` : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSelectChild = (id: string) => {
    router.push(`${pathname}?enfant=${id}`);
  };

  type NavLink = { href: string; label: string; emoji: string; match: string; badge?: number | null };
  const links: NavLink[] = [
    { href: `/parent${enfantQ}`, label: "Tableau de bord", emoji: "🏠", match: "/parent" },
    { href: `/parent/rapports${enfantQ}`, label: "Rapports", emoji: "📊", match: "/parent/rapports" },
    { href: `/parent/progression${enfantQ}`, label: "Progression", emoji: "📈", match: "/parent/progression" },
    ...(specialistesOn ? [
      { href: `/parent/specialistes${enfantQ}`, label: "Spécialistes", emoji: "👩‍⚕️", match: "/parent/specialistes" },
      { href: `/parent/rendez-vous${enfantQ}`, label: "Rendez-vous", emoji: "📅", match: "/parent/rendez-vous" },
    ] : []),
    {
      href: `/parent/notifications${enfantQ}`,
      label: "Notifications",
      emoji: "🔔",
      match: "/parent/notifications",
      badge: nonLues && nonLues > 0 ? nonLues : null,
    },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", emoji: "⚙️", match: "/admin" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-rule)] bg-white/90 backdrop-blur-sm" ref={menuRef}>
      {/* Row 1 : logo + onglets + actions */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={`/parent${enfantQ}`} className="text-lg font-black text-[var(--color-ink)]">
          ✦ Édu-Réussite
        </Link>

        {/* Navigation desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.match}
              href={link.href}
              active={link.match === "/parent" ? pathname === "/parent" : pathname.startsWith(link.match)}
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

        {/* Droite : badge rôle + déconnexion + hamburger */}
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

      {/* Row 2 : sélecteur d'enfant (desktop + mobile, visible sur toutes les pages parent) */}
      {enfants.length > 1 && (
        <div className="border-t border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
          <div className="mx-auto max-w-5xl px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mr-1 hidden sm:block">
              Enfant :
            </span>
            {enfants.map((e) => (
              <button
                key={e.id}
                onClick={() => handleSelectChild(e.id)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                  activeEnfantId === e.id
                    ? "bg-[var(--color-ink)] text-white"
                    : "border border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                )}
              >
                {e.prenom}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu mobile déroulant */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-rule)] bg-white px-4 py-3 md:hidden">
          <div className="space-y-1">
            {links.map((link) => {
              const active = link.match === "/parent" ? pathname === "/parent" : pathname.startsWith(link.match);
              return (
                <Link
                  key={link.match}
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

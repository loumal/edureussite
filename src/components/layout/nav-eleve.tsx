"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";
import { getGradientAvatar } from "@/lib/boutique/items";

interface NavEleveProps {
  prenom: string;
  streak: number;
  niveauScolaire?: string;
  avatarEquipe?: string;
}

export function NavEleve({ prenom, streak, niveauScolaire, avatarEquipe }: NavEleveProps) {
  const jeune = estJeuneEleve(niveauScolaire ?? "");
  const avatarGradient = getGradientAvatar(avatarEquipe ?? "avatar_violet");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const { data: coursNonLus } = trpc.cours.countNonLus.useQuery(undefined, { refetchInterval: 60_000 });
  const unread = coursNonLus ?? 0;

  // 4 primary nav items only
  const primaryLinks = [
    { href: "/eleve",            label: jeune ? "🏠 Maison"    : "Accueil",    match: (p: string) => p === "/eleve" },
    { href: "/eleve/exercices",  label: jeune ? "✏️ Exercices" : "Exercices",  match: (p: string) => p.startsWith("/eleve/exercices") || p.startsWith("/eleve/plan") },
    { href: "/eleve/progression",label: jeune ? "⭐ Progrès"   : "Progression",match: (p: string) => p.startsWith("/eleve/progression") },
    { href: "/eleve/boutique",   label: jeune ? "🛍️ Boutique"  : "Boutique",   match: (p: string) => p.startsWith("/eleve/boutique") || p.startsWith("/eleve/jeux") },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--color-rule)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14">

          {/* Logo */}
          <Link href="/eleve" className="text-base font-black text-[var(--color-ink)] flex-shrink-0">
            ✦ Édu-Réussite
          </Link>

          {/* Primary links — desktop */}
          <div className="hidden items-center gap-0.5 md:flex">
            {primaryLinks.map(link => (
              <NavLink key={link.href} href={link.href} active={link.match(pathname)}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2" ref={menuRef}>
            {/* Streak pill */}
            {streak > 0 && (
              <div className="hidden sm:flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-600">
                🔥 {streak}j
              </div>
            )}

            {/* Avatar button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-sm font-black text-white ring-2 ring-white shadow-sm`}
              aria-label="Menu"
            >
              {prenom.charAt(0).toUpperCase()}
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-accent)]" />
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-4 top-14 z-50 w-56 rounded-2xl border border-[var(--color-rule)] bg-white shadow-xl p-1.5">
                {/* User header */}
                <div className="px-3 py-2 flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-black text-white`}>
                    {prenom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{prenom}</p>
                    {streak > 0 && <p className="text-xs text-amber-500 font-semibold">🔥 {streak} jours de série</p>}
                  </div>
                </div>

                <div className="h-px bg-[var(--color-rule)] mx-1 my-1" />

                <MenuLink href="/eleve/cours" onClick={() => setMenuOpen(false)}>
                  <span className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">📚 Mes cours</span>
                    {unread > 0 && <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
                  </span>
                </MenuLink>
                <MenuLink href="/eleve/plan" onClick={() => setMenuOpen(false)}>🗺️ Mon plan</MenuLink>
                <MenuLink href="/eleve/jeux/multijoueur" onClick={() => setMenuOpen(false)}>🎮 Multijoueur</MenuLink>

                <div className="h-px bg-[var(--color-rule)] mx-1 my-1" />

                <MenuLink href="/eleve/parametres" onClick={() => setMenuOpen(false)}>⚙️ Paramètres</MenuLink>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  🚪 Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <BottomBar pathname={pathname} unread={unread} streak={streak} prenom={prenom} jeune={jeune} avatarGradient={avatarGradient} />
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
      }`}>
      {children}
    </Link>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)] transition-colors">
      {children}
    </Link>
  );
}

function BottomBar({ pathname, unread, streak, prenom, jeune, avatarGradient }: {
  pathname: string; unread: number; streak: number; prenom: string; jeune: boolean; avatarGradient: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const tabs = [
    { href: "/eleve",             icon: "🏠", label: "Accueil",   active: pathname === "/eleve" },
    { href: "/eleve/exercices/nouveau", icon: "✨", label: "Exercice", active: false, cta: true },
    { href: "/eleve/progression", icon: "📈", label: "Progrès",   active: pathname.startsWith("/eleve/progression") },
    { href: "/eleve/boutique",    icon: "🛍️", label: "Boutique",  active: pathname.startsWith("/eleve/boutique") || pathname.startsWith("/eleve/jeux") },
  ];

  return (
    <div ref={ref} className="md:hidden">
      {/* Profile popup */}
      {open && (
        <div className="fixed bottom-20 right-3 z-50 w-52 rounded-2xl border border-[var(--color-rule)] bg-white shadow-xl p-1.5">
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-[var(--color-ink)]">{prenom}</p>
            {streak > 0 && <p className="text-xs text-amber-500 font-semibold">🔥 {streak} jours</p>}
          </div>
          <div className="h-px bg-[var(--color-rule)] mx-1 my-1" />
          <Link href="/eleve/cours" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
            <span className="flex items-center gap-2">📚 Mes cours</span>
            {unread > 0 && <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
          <Link href="/eleve/plan" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">🗺️ Mon plan</Link>
          <Link href="/eleve/jeux/multijoueur" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">🎮 Multijoueur</Link>
          <div className="h-px bg-[var(--color-rule)] mx-1 my-1" />
          <Link href="/eleve/parametres" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">⚙️ Paramètres</Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50">🚪 Déconnexion</button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-rule)] bg-white/97 backdrop-blur-md">
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => tab.cta ? (
            <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-lg shadow-md">
                {tab.icon}
              </span>
              <span className="text-[10px] font-black text-[var(--color-ink)] mt-0.5">{tab.label}</span>
            </Link>
          ) : (
            <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-90">
              <span className={`text-xl transition-all duration-200 ${tab.active ? "scale-110" : "opacity-40"}`}>{tab.icon}</span>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${tab.active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>{tab.label}</span>
              <span className={`h-0.5 rounded-full bg-[var(--color-ink)] transition-all duration-300 ${tab.active ? "w-4 opacity-100" : "w-0 opacity-0"}`} />
            </Link>
          ))}

          {/* Profil */}
          <button onClick={() => setOpen(!open)} className="flex flex-1 flex-col items-center justify-center gap-0.5 relative">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-black text-white transition-all ${open ? "scale-110" : "opacity-70"}`}>
              {prenom.charAt(0).toUpperCase()}
            </span>
            <span className={`text-[10px] font-semibold ${open ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>Moi</span>
            {unread > 0 && <span className="absolute top-2 right-[calc(50%-16px)] h-2 w-2 rounded-full border border-white bg-[var(--color-accent)]" />}
          </button>
        </div>
      </nav>
    </div>
  );
}

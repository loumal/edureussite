"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";

interface NavEleveProps {
  prenom: string;
  streak: number;
  niveauScolaire?: string;
}

export function NavEleve({ prenom, streak, niveauScolaire }: NavEleveProps) {
  const jeune = estJeuneEleve(niveauScolaire ?? "");
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

  const { data: coursNonLus } = trpc.cours.countNonLus.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  return (
    <>
      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-rule)] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/eleve" className="text-lg font-black text-[var(--color-ink)]">
            ✦ ÉduRéussite
          </Link>

          {/* Navigation centrale — desktop uniquement */}
          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="/eleve" active={pathname === "/eleve"}>
              {jeune ? "🏠 Maison" : "Aujourd'hui"}
            </NavLink>
            <NavLink href="/eleve/cours" active={pathname.startsWith("/eleve/cours")}>
              <span className="flex items-center gap-1.5">
                {jeune ? "📚 Mes cours" : "Mes cours"}
                {coursNonLus && coursNonLus > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                    {coursNonLus > 9 ? "9+" : coursNonLus}
                  </span>
                ) : null}
              </span>
            </NavLink>
            <NavLink href="/eleve/plan" active={pathname.startsWith("/eleve/plan")}>
              {jeune ? "🗺️ Mon plan" : "Mon plan"}
            </NavLink>
            <NavLink href="/eleve/exercices" active={pathname.startsWith("/eleve/exercices")}>
              {jeune ? "✏️ Exercices" : "Mes exercices"}
            </NavLink>
            <NavLink href="/eleve/progression" active={pathname.startsWith("/eleve/progression")}>
              {jeune ? "⭐ Mes étoiles" : "Ma progression"}
            </NavLink>
          </div>

          {/* Streak + avatar — desktop */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            {streak > 0 && (
              <div className="hidden items-center gap-1 rounded-full bg-[rgba(201,149,42,0.12)] px-3 py-1 text-xs font-bold text-[var(--color-gold)] sm:flex">
                🔥 {streak} jour{streak > 1 ? "s" : ""}
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-sm font-bold text-white flex-shrink-0"
              aria-label="Menu utilisateur"
            >
              {prenom.charAt(0).toUpperCase()}
              {coursNonLus && coursNonLus > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-accent)]" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-13 z-50 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--color-rule)] bg-white p-1 shadow-[var(--shadow-elevated)]">
                <div className="px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                  Connecté(e) comme{" "}
                  <span className="font-semibold text-[var(--color-ink)]">{prenom}</span>
                  {streak > 0 && (
                    <span className="ml-1.5 font-bold text-[var(--color-gold)]">🔥 {streak}j</span>
                  )}
                </div>
                <hr className="my-1 border-[var(--color-rule)]" />
                <Link href="/eleve/parametres" onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
                  ⚙️ Paramètres
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)]"
                >
                  🚪 Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Bottom tab bar — mobile uniquement ── */}
      <BottomTabBar pathname={pathname} coursNonLus={coursNonLus ?? 0} streak={streak} prenom={prenom} jeune={jeune} />
    </>
  );
}

function BottomTabBar({
  pathname,
  coursNonLus,
  streak,
  prenom,
  jeune,
}: {
  pathname: string;
  coursNonLus: number;
  streak: number;
  prenom: string;
  jeune: boolean;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setProfileOpen(false); }, [pathname]);

  const tabs = jeune ? [
    { href: "/eleve",                   emoji: "🏠", label: "Maison",   active: pathname === "/eleve" },
    { href: "/eleve/plan",              emoji: "🗺️", label: "Mon plan", active: pathname.startsWith("/eleve/plan") },
    { href: "/eleve/exercices/nouveau", emoji: "✨", label: "Jouer !",  active: false, cta: true },
    { href: "/eleve/progression",       emoji: "⭐", label: "Étoiles",  active: pathname.startsWith("/eleve/progression") },
  ] : [
    { href: "/eleve",                   emoji: "🏠", label: "Accueil",  active: pathname === "/eleve" },
    { href: "/eleve/plan",              emoji: "🗺️", label: "Mon plan", active: pathname.startsWith("/eleve/plan") },
    { href: "/eleve/exercices/nouveau", emoji: "✨", label: "Exercice", active: false, cta: true },
    { href: "/eleve/progression",       emoji: "📈", label: "Progrès",  active: pathname.startsWith("/eleve/progression") },
  ];

  return (
    <div ref={ref} className="md:hidden">
      {/* Profile popup */}
      {profileOpen && (
        <div className="fixed bottom-20 right-3 z-50 w-56 rounded-xl border border-[var(--color-rule)] bg-white p-1 shadow-[var(--shadow-elevated)]">
          <div className="px-3 py-2 text-xs text-[var(--color-ink-soft)]">
            <span className="font-semibold text-[var(--color-ink)]">{prenom}</span>
            {streak > 0 && <span className="ml-1.5 font-bold text-[var(--color-gold)]">🔥 {streak}j</span>}
          </div>
          <hr className="my-1 border-[var(--color-rule)]" />
          <Link href="/eleve/cours"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
            <span className="flex items-center gap-2">📚 Mes cours</span>
            {coursNonLus > 0 && (
              <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">{coursNonLus}</span>
            )}
          </Link>
          <Link href="/eleve/parametres"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]">
            ⚙️ Paramètres
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.06)]"
          >
            🚪 Se déconnecter
          </button>
        </div>
      )}

      {/* Tab bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-rule)] bg-white/95 backdrop-blur-md ${jeune ? "pb-safe" : ""}`}>
        <div className="flex items-center">
          {tabs.map((tab) => (
            tab.cta ? (
              <Link key={tab.href} href={tab.href} className={`flex flex-1 flex-col items-center justify-center ${jeune ? "py-3" : "py-2"}`}>
                <span className={`flex items-center justify-center rounded-full bg-[var(--color-ink)] shadow-sm ${jeune ? "h-14 w-14 text-2xl" : "h-10 w-10 text-lg"}`}>
                  {tab.emoji}
                </span>
                <span className={`mt-0.5 font-black text-[var(--color-ink)] ${jeune ? "text-xs" : "text-[10px]"}`}>{tab.label}</span>
              </Link>
            ) : (
              <Link key={tab.href} href={tab.href} className={`flex flex-1 flex-col items-center justify-center ${jeune ? "py-3" : "py-2"}`}>
                <span className={`transition-transform ${jeune ? "text-3xl" : "text-xl"} ${tab.active ? "scale-110" : "opacity-50"}`}>
                  {tab.emoji}
                </span>
                <span className={`mt-0.5 font-semibold ${jeune ? "text-xs" : "text-[10px]"} ${tab.active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                  {tab.label}
                </span>
                {tab.active && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-[var(--color-ink)]" />
                )}
              </Link>
            )
          ))}

          {/* Onglet profil */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex flex-1 flex-col items-center justify-center relative ${jeune ? "py-3" : "py-2"}`}
            aria-label="Profil"
          >
            <span className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] font-bold text-white transition-transform ${jeune ? "h-10 w-10 text-base" : "h-7 w-7 text-xs"} ${profileOpen ? "scale-110" : "opacity-70"}`}>
              {prenom.charAt(0).toUpperCase()}
            </span>
            <span className={`mt-0.5 font-semibold ${jeune ? "text-xs" : "text-[10px]"} ${profileOpen ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
              Moi
            </span>
            {coursNonLus > 0 && (
              <span className="absolute top-1 right-[calc(50%-18px)] h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--color-accent)]" />
            )}
          </button>
        </div>
      </nav>
    </div>
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

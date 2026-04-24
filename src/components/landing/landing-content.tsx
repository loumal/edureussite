"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Contenu bilingue ─────────────────────────────────────────────────────────

const CONTENT = {
  FR: {
    nav: { login: "Se connecter", register: "Commencer gratuitement" },
    pickBanner: "Choisissez votre province pour personnaliser votre expérience",
    pickLabel: "Province",
    langToggle: "EN",
    badge: (curriculum: string) => `Aligné sur le curriculum · ${curriculum}`,
    hero: {
      title: ["Chaque élève mérite", "un parcours unique."],
      audience: "Pour les élèves du primaire et du secondaire",
      sub: "Une plateforme intelligente qui s'adapte à chaque enfant, de la 1re année au 5e secondaire — pour que réussir à l'école ne soit plus une question de chance.",
      cta: "Commencer gratuitement",
      ctaSub: "J'ai déjà un compte",
      tagline: "Gratuit · Sans carte de crédit · Prêt en 2 minutes",
    },
    stats: [
      { valeur: "100 %", label: "Aligné sur le curriculum officiel", detail: "De la 1re année au 5e secondaire" },
      { valeur: "< 5 min", label: "Pour démarrer", detail: "Profil créé, plan actif" },
      { valeur: "3 rôles", label: "Connectés en temps réel", detail: "Élève · Parent · Enseignant" },
    ],
    roles: [
      { role: "Élève", accroche: "Apprends à ton rythme, sans pression.", desc: "De la 1re année du primaire au 5e secondaire — la plateforme s'ajuste à ton niveau réel du jour, détecte ce qui te bloque et t'aide à progresser pas à pas." },
      { role: "Parent", accroche: "Restez dans la boucle, sans vous noyer.", desc: "Suivez la progression de vos enfants, recevez des alertes pertinentes et accédez à des recommandations d'experts." },
      { role: "Enseignant", accroche: "Chaque élève visible, en un coup d'œil.", desc: "Détectez les difficultés avant qu'elles ne s'installent. Intervenez au bon moment, avec les bons outils." },
    ],
    steps: {
      title: ["Simple à mettre en place."],
      sub: "Démarrage",
      items: [
        { num: "01", titre: "Créez votre profil", desc: "En deux minutes. Niveau, besoins, préférences — la plateforme s'adapte immédiatement." },
        { num: "02", titre: "L'intelligence analyse", desc: "Un plan personnalisé se construit automatiquement, ancré dans les exigences officielles du curriculum." },
        { num: "03", titre: "Progressez chaque jour", desc: "Des contenus ajustés en continu. Des résultats mesurables, visibles par toute la famille." },
      ],
    },
    testimonials: {
      title: "Des résultats concrets.",
      sub: "Témoignages",
      items: [
        { texte: "En six semaines, mon fils a gagné 18 points à ses évaluations. Je n'aurais jamais cru que ce serait possible si vite.", auteur: "Marie-Claude B.", role: "Parent · 3e secondaire", initiale: "M" },
        { texte: "Pour la première fois de ma carrière, j'ai un outil qui s'adapte vraiment à la réalité de chaque élève en classe.", auteur: "Jean-François T.", role: "Enseignant · Primaire", initiale: "J" },
        { texte: "J'aimais pas les maths. Maintenant j'ai hâte d'ouvrir la plateforme le matin. Mon streak est à 34 jours.", auteur: "Léa, 13 ans", role: "Élève · 2e secondaire", initiale: "L" },
      ],
    },
    cta: {
      title: ["Prêt à changer", "leur trajectoire ?"],
      sub: "Rejoignez les familles et enseignants qui font confiance à ÉduRéussite pour accompagner la réussite de chaque élève.",
      btn: "Créer un compte gratuit",
      btnSub: "Se connecter",
      tagline: "Aucun engagement · Données protégées",
    },
    footer: {
      brand: "✦ ÉduRéussite",
      privacy: "Politique de confidentialité",
      register: "S'inscrire",
      login: "Connexion",
      copy: (year: number) => `© ${year} ÉduRéussite · Canada`,
    },
    commitment: {
      sub: "Notre engagement",
      title: ["L'IA accompagne.", "Les humains décident."],
      desc: "ÉduRéussite utilise l'intelligence artificielle comme outil d'appui — jamais comme substitut au jugement professionnel. Chaque recommandation est conçue pour informer, non pour remplacer l'expertise des enseignants, des parents et des spécialistes.",
      pillars: [
        { icon: "🎓", titre: "L'humain au centre", desc: "La technologie soutient — elle ne remplace pas. Nous croyons en la collaboration avec les professionnels de l'éducation." },
        { icon: "🔒", titre: "Vous gardez le contrôle", desc: "Les parents et enseignants restent les décideurs. L'IA ne fait que mettre en lumière ce qui compte." },
      ],
    },
  },
  EN: {
    nav: { login: "Sign in", register: "Get started free" },
    pickBanner: "Choose your province to personalize your experience",
    pickLabel: "Province",
    langToggle: "FR",
    badge: (curriculum: string) => `Aligned with the ${curriculum}`,
    hero: {
      title: ["Every student deserves", "a unique path."],
      audience: "For elementary and high school students",
      sub: "An intelligent platform that adapts to every child, from Grade 1 to Grade 11 — so that academic success is no longer a matter of luck.",
      cta: "Get started free",
      ctaSub: "I already have an account",
      tagline: "Free · No credit card · Ready in 2 minutes",
    },
    stats: [
      { valeur: "100 %", label: "Aligned with the official curriculum", detail: "From Grade 1 to Grade 11" },
      { valeur: "< 5 min", label: "To get started", detail: "Profile created, plan active" },
      { valeur: "3 roles", label: "Connected in real time", detail: "Student · Parent · Teacher" },
    ],
    roles: [
      { role: "Student", accroche: "Learn at your own pace, without pressure.", desc: "From Grade 1 to Grade 11 — the platform adjusts to your real level each day, detects what's blocking you, and helps you progress step by step." },
      { role: "Parent", accroche: "Stay in the loop, without the overwhelm.", desc: "Track your child's progress, receive relevant alerts, and access expert recommendations." },
      { role: "Teacher", accroche: "Every student visible, at a glance.", desc: "Detect difficulties before they take root. Intervene at the right time, with the right tools." },
    ],
    steps: {
      title: ["Simple to set up."],
      sub: "Getting started",
      items: [
        { num: "01", titre: "Create your profile", desc: "In two minutes. Grade level, needs, preferences — the platform adapts immediately." },
        { num: "02", titre: "AI analyzes", desc: "A personalized plan builds automatically, grounded in the official curriculum requirements." },
        { num: "03", titre: "Progress every day", desc: "Continuously adjusted content. Measurable results, visible to the whole family." },
      ],
    },
    testimonials: {
      title: "Real results.",
      sub: "Testimonials",
      items: [
        { texte: "In six weeks, my son gained 18 points on his assessments. I never thought it would be possible so quickly.", auteur: "Marie-Claude B.", role: "Parent · Grade 9", initiale: "M" },
        { texte: "For the first time in my career, I have a tool that truly adapts to the reality of each student in the classroom.", auteur: "Jean-François T.", role: "Teacher · Elementary", initiale: "J" },
        { texte: "I used to hate math. Now I look forward to opening the platform every morning. My streak is at 34 days.", auteur: "Léa, 13", role: "Student · Grade 8", initiale: "L" },
      ],
    },
    cta: {
      title: ["Ready to change", "their trajectory?"],
      sub: "Join the families and teachers who trust ÉduRéussite to support every student's success.",
      btn: "Create a free account",
      btnSub: "Sign in",
      tagline: "No commitment · Data protected",
    },
    footer: {
      brand: "✦ ÉduRéussite",
      privacy: "Privacy policy",
      register: "Sign up",
      login: "Sign in",
      copy: (year: number) => `© ${year} ÉduRéussite · Canada`,
    },
    commitment: {
      sub: "Our commitment",
      title: ["AI supports.", "Humans decide."],
      desc: "ÉduRéussite uses artificial intelligence as a support tool — never as a substitute for professional judgment. Every recommendation is designed to inform, not replace the expertise of teachers, parents, and specialists.",
      pillars: [
        { icon: "🎓", titre: "Humans at the center", desc: "Technology supports — it doesn't replace. We believe in collaboration with education professionals." },
        { icon: "🔒", titre: "You stay in control", desc: "Parents and teachers remain the decision-makers. AI only illuminates what matters." },
      ],
    },
  },
} as const;

type Lang = "FR" | "EN";

const PROVINCES_INFO: Record<string, { nom: string; nomEN: string; curriculum: string; langue: Lang; groupe?: "canada" | "francophonie" }> = {
  // ── Canada ─────────────────────────────────────────────────────────────────
  QC: { nom: "Québec",                    nomEN: "Quebec",                      curriculum: "PFEQ",                          langue: "FR", groupe: "canada" },
  ON: { nom: "Ontario",                   nomEN: "Ontario",                     curriculum: "Ontario Curriculum",            langue: "EN", groupe: "canada" },
  BC: { nom: "Colombie-Britannique",      nomEN: "British Columbia",            curriculum: "BC Curriculum",                 langue: "EN", groupe: "canada" },
  AB: { nom: "Alberta",                   nomEN: "Alberta",                     curriculum: "Alberta Program of Studies",    langue: "EN", groupe: "canada" },
  SK: { nom: "Saskatchewan",              nomEN: "Saskatchewan",                curriculum: "SK Curriculum",                 langue: "EN", groupe: "canada" },
  MB: { nom: "Manitoba",                  nomEN: "Manitoba",                    curriculum: "Manitoba Curriculum",           langue: "EN", groupe: "canada" },
  NB: { nom: "Nouveau-Brunswick",         nomEN: "New Brunswick",               curriculum: "NB Curriculum",                 langue: "FR", groupe: "canada" },
  NS: { nom: "Nouvelle-Écosse",           nomEN: "Nova Scotia",                 curriculum: "NS Curriculum",                 langue: "EN", groupe: "canada" },
  PE: { nom: "Île-du-Prince-Édouard",     nomEN: "Prince Edward Island",        curriculum: "PEI Curriculum",                langue: "EN", groupe: "canada" },
  NL: { nom: "Terre-Neuve-et-Labrador",   nomEN: "Newfoundland and Labrador",   curriculum: "NL Curriculum",                 langue: "EN", groupe: "canada" },
  YT: { nom: "Yukon",                     nomEN: "Yukon",                       curriculum: "Yukon Curriculum",              langue: "EN", groupe: "canada" },
  NT: { nom: "Territoires du Nord-Ouest", nomEN: "Northwest Territories",       curriculum: "NWT Curriculum",                langue: "EN", groupe: "canada" },
  NU: { nom: "Nunavut",                   nomEN: "Nunavut",                     curriculum: "Nunavut Curriculum",            langue: "EN", groupe: "canada" },
  // ── France ─────────────────────────────────────────────────────────────────
  FR: { nom: "France",                    nomEN: "France",                      curriculum: "Programmes MEN (France)",       langue: "FR", groupe: "francophonie" },
  // ── Afrique francophone ────────────────────────────────────────────────────
  CI: { nom: "Côte d'Ivoire",             nomEN: "Côte d'Ivoire",               curriculum: "Programmes MENA",               langue: "FR", groupe: "francophonie" },
  SN: { nom: "Sénégal",                   nomEN: "Senegal",                     curriculum: "Curricula MELS Sénégal",        langue: "FR", groupe: "francophonie" },
  CM: { nom: "Cameroun",                  nomEN: "Cameroon",                    curriculum: "Programmes MINEDUB/MINESEC",    langue: "FR", groupe: "francophonie" },
  BF: { nom: "Burkina Faso",              nomEN: "Burkina Faso",                curriculum: "Programmes MENAPLN",            langue: "FR", groupe: "francophonie" },
  ML: { nom: "Mali",                      nomEN: "Mali",                        curriculum: "Programmes MEALN Mali",         langue: "FR", groupe: "francophonie" },
  BJ: { nom: "Bénin",                     nomEN: "Benin",                       curriculum: "Programmes MEMP Bénin",         langue: "FR", groupe: "francophonie" },
  TG: { nom: "Togo",                      nomEN: "Togo",                        curriculum: "Programmes MEN Togo",           langue: "FR", groupe: "francophonie" },
  GA: { nom: "Gabon",                     nomEN: "Gabon",                       curriculum: "Programmes MEN Gabon",          langue: "FR", groupe: "francophonie" },
  CD: { nom: "R.D. Congo",                nomEN: "D.R. Congo",                  curriculum: "Programmes MEPSP RDC",          langue: "FR", groupe: "francophonie" },
  CG: { nom: "Congo-Brazzaville",         nomEN: "Republic of Congo",           curriculum: "Programmes MEPSA Congo",        langue: "FR", groupe: "francophonie" },
  GN: { nom: "Guinée",                    nomEN: "Guinea",                      curriculum: "Programmes MEPUA Guinée",       langue: "FR", groupe: "francophonie" },
  MG: { nom: "Madagascar",                nomEN: "Madagascar",                  curriculum: "Programmes MEN Madagascar",     langue: "FR", groupe: "francophonie" },
  NE: { nom: "Niger",                     nomEN: "Niger",                       curriculum: "Programmes MEN Niger",          langue: "FR", groupe: "francophonie" },
  TD: { nom: "Tchad",                     nomEN: "Chad",                        curriculum: "Programmes MEN Tchad",          langue: "FR", groupe: "francophonie" },
  CF: { nom: "Rép. Centrafricaine",       nomEN: "Central African Republic",    curriculum: "Programmes MEN RCA",            langue: "FR", groupe: "francophonie" },
  RW: { nom: "Rwanda",                    nomEN: "Rwanda",                      curriculum: "Programmes REB Rwanda",         langue: "FR", groupe: "francophonie" },
  BI: { nom: "Burundi",                   nomEN: "Burundi",                     curriculum: "Programmes MEN Burundi",        langue: "FR", groupe: "francophonie" },
  DJ: { nom: "Djibouti",                  nomEN: "Djibouti",                    curriculum: "Programmes MEN Djibouti",       langue: "FR", groupe: "francophonie" },
  KM: { nom: "Comores",                   nomEN: "Comoros",                     curriculum: "Programmes MEN Comores",        langue: "FR", groupe: "francophonie" },
};

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  multiProvince: boolean;
  provincesActives: Record<string, boolean>;
}

export function LandingContent({ multiProvince, provincesActives }: Props) {
  const [province, setProvince] = useState("QC");
  const [lang, setLang] = useState<Lang>("FR");
  const [mounted, setMounted] = useState(false);

  // Charger depuis localStorage
  useEffect(() => {
    setMounted(true);
    if (!multiProvince) return;
    const savedProvince = localStorage.getItem("edur_province") ?? "QC";
    const savedLang = localStorage.getItem("edur_lang") as Lang | null;
    const info = PROVINCES_INFO[savedProvince];
    const defaultLang = info?.langue ?? "FR";
    setProvince(savedProvince);
    setLang(savedLang ?? defaultLang);
  }, [multiProvince]);

  function handleProvinceChange(code: string) {
    setProvince(code);
    const info = PROVINCES_INFO[code];
    const defaultLang = info?.langue ?? "FR";
    setLang(defaultLang);
    localStorage.setItem("edur_province", code);
    localStorage.setItem("edur_lang", defaultLang);
  }

  function handleLangToggle() {
    const next: Lang = lang === "FR" ? "EN" : "FR";
    setLang(next);
    localStorage.setItem("edur_lang", next);
  }

  const c = CONTENT[lang];
  const provinceInfo = PROVINCES_INFO[province] ?? PROVINCES_INFO.QC;
  const curriculum = provinceInfo.curriculum;
  const year = new Date().getFullYear();

  // Régions/pays activés pour le sélecteur (groupés)
  const provOptions = Object.entries(PROVINCES_INFO).filter(([code]) => provincesActives[code]);
  const provCanada = provOptions.filter(([, info]) => info.groupe === "canada");
  const provFrancophonie = provOptions.filter(([, info]) => info.groupe === "francophonie");

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] antialiased">

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <LandingNav
        multiProvince={multiProvince}
        lang={lang}
        province={province}
        provCanada={provCanada}
        provFrancophonie={provFrancophonie}
        onProvinceChange={handleProvinceChange}
        onLangToggle={handleLangToggle}
        c={c.nav}
        mounted={mounted}
      />

      {/* ── BANNER PROVINCE (multi-province actif) ────────────────── */}
      {multiProvince && mounted && (
        <div className="pt-[72px]">
          <div className="border-b border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-6 py-2.5">
            <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-[var(--color-ink-soft)]">{c.pickBanner}</p>
              <div className="flex items-center gap-3">
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                >
                  {provCanada.length > 0 && (
                    <optgroup label={lang === "FR" ? "🇨🇦 Canada" : "🇨🇦 Canada"}>
                      {provCanada.map(([code, info]) => (
                        <option key={code} value={code}>{lang === "FR" ? info.nom : info.nomEN}</option>
                      ))}
                    </optgroup>
                  )}
                  {provFrancophonie.length > 0 && (
                    <optgroup label={lang === "FR" ? "🌍 France & Afrique francophone" : "🌍 France & Francophone Africa"}>
                      {provFrancophonie.map(([code, info]) => (
                        <option key={code} value={code}>{lang === "FR" ? info.nom : info.nomEN}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {/* NB est bilingue, les autres peuvent choisir */}
                {(province === "NB" || provinceInfo.langue !== lang) && (
                  <button
                    onClick={handleLangToggle}
                    className="rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-colors"
                  >
                    {c.langToggle}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden pt-36 pb-28 px-6 ${multiProvince && mounted ? "pt-24" : ""}`}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(217,79,43,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              <span className="text-xs font-semibold text-[var(--color-ink-soft)] tracking-wide">
                {c.badge(curriculum)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,79,43,0.25)] bg-[rgba(217,79,43,0.06)] px-4 py-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="text-xs font-semibold text-[var(--color-accent)] tracking-wide">
                {c.hero.audience}
              </span>
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            {c.hero.title[0]}<br />
            <span style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-purple) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {c.hero.title[1]}
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-[var(--color-ink-soft)] leading-relaxed font-light">
            {c.hero.sub}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="group relative overflow-hidden rounded-2xl bg-[var(--color-ink)] px-8 py-4 text-sm font-bold text-white shadow-[0_8px_32px_rgba(15,22,35,0.22)] transition-all hover:shadow-[0_12px_40px_rgba(15,22,35,0.28)] hover:-translate-y-0.5">
              {c.hero.cta}
            </Link>
            <Link href="/login" className="rounded-2xl border border-[var(--color-rule)] bg-white px-8 py-4 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition-all hover:bg-[var(--color-paper-warm)] hover:-translate-y-0.5">
              {c.hero.ctaSub}
            </Link>
          </div>

          <p className="mt-5 text-xs text-[var(--color-ink-soft)] tracking-wide">{c.hero.tagline}</p>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--color-rule)] bg-white py-14 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
            {c.stats.map((s) => (
              <div key={s.valeur} className="flex flex-col items-center gap-1">
                <span className="text-4xl font-black text-[var(--color-ink)] tracking-tight leading-none">{s.valeur}</span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">{s.label}</span>
                <span className="text-xs text-[var(--color-ink-soft)]">{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POUR QUI ────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">
              {lang === "FR" ? "Conçu pour vous" : "Built for you"}
            </p>
            <h2 className="text-3xl font-black text-[var(--color-ink)] sm:text-4xl">
              {lang === "FR" ? <>Une expérience taillée sur mesure,<br className="hidden sm:block" /> pour chaque rôle.</> : <>A tailored experience,<br className="hidden sm:block" /> for every role.</>}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {c.roles.map((p, i) => {
              const colors = [
                { couleur: "from-[rgba(42,124,111,0.08)] to-transparent", accent: "var(--color-success)" },
                { couleur: "from-[rgba(217,79,43,0.08)] to-transparent", accent: "var(--color-accent)" },
                { couleur: "from-[rgba(139,92,246,0.08)] to-transparent", accent: "var(--color-purple)" },
              ];
              const col = colors[i];
              return (
                <div key={p.role} className="group relative overflow-hidden rounded-3xl border border-[var(--color-rule)] bg-white p-8 transition-all hover:shadow-[0_8px_40px_rgba(15,22,35,0.09)] hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${col.couleur} opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden />
                  <div className="relative">
                    <div className="mb-5 inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: `color-mix(in srgb, ${col.accent} 12%, transparent)`, color: col.accent }}>{p.role}</div>
                    <h3 className="mb-3 text-lg font-black text-[var(--color-ink)] leading-snug">{p.accroche}</h3>
                    <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ÉTAPES ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">{c.steps.sub}</p>
            <h2 className="text-3xl font-black text-[var(--color-ink)] sm:text-4xl">{c.steps.title[0]}</h2>
          </div>
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            <div aria-hidden className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-[var(--color-rule)] md:block" />
            {c.steps.items.map((e) => (
              <div key={e.num} className="relative flex flex-col items-center text-center px-4">
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[var(--color-rule)] shadow-sm">
                  <span className="text-2xl font-black text-[var(--color-ink)]">{e.num}</span>
                </div>
                <h3 className="mb-2 text-base font-bold text-[var(--color-ink)]">{e.titre}</h3>
                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-xs">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--color-rule)]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">{c.testimonials.sub}</p>
            <h2 className="text-3xl font-black text-[var(--color-ink)] sm:text-4xl">{c.testimonials.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {c.testimonials.items.map((t) => (
              <div key={t.auteur} className="flex flex-col justify-between rounded-3xl border border-[var(--color-rule)] bg-white p-8">
                <div>
                  <p className="mb-1 text-5xl font-black leading-none select-none" style={{ color: "rgba(15,22,35,0.08)" }} aria-hidden>"</p>
                  <p className="text-[15px] text-[var(--color-ink)] leading-relaxed">{t.texte}</p>
                </div>
                <div className="mt-8 flex items-center gap-3 border-t border-[var(--color-rule)] pt-5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-black text-white">{t.initiale}</div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-ink)]">{t.auteur}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-[var(--color-rule)] py-28 px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(217,79,43,0.06) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-black text-[var(--color-ink)] leading-[1.1] tracking-tight sm:text-5xl">
            {c.cta.title[0]}<br />{c.cta.title[1]}
          </h2>
          <p className="mb-10 text-lg text-[var(--color-ink-soft)] leading-relaxed font-light">{c.cta.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="rounded-2xl bg-[var(--color-ink)] px-9 py-4 text-sm font-bold text-white shadow-[0_8px_32px_rgba(15,22,35,0.2)] transition-all hover:opacity-90 hover:-translate-y-0.5">{c.cta.btn}</Link>
            <Link href="/login" className="rounded-2xl border border-[var(--color-rule)] bg-white px-9 py-4 text-sm font-semibold text-[var(--color-ink)] transition-all hover:bg-[var(--color-paper-warm)] hover:-translate-y-0.5">{c.cta.btnSub}</Link>
          </div>
          <p className="mt-6 text-xs text-[var(--color-ink-soft)] tracking-wide">{c.cta.tagline}</p>
        </div>
      </section>

      {/* ── ENGAGEMENT ──────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper-warm)] py-14 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">{c.commitment.sub}</p>
              <h3 className="text-xl font-black text-[var(--color-ink)] leading-snug mb-3">
                {c.commitment.title[0]}<br />{c.commitment.title[1]}
              </h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-md">{c.commitment.desc}</p>
            </div>
            <div className="flex flex-col gap-4 min-w-0 md:w-72">
              {c.commitment.pillars.map((p) => (
                <div key={p.titre} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{p.titre}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-rule)] bg-white py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <p className="text-sm font-black text-[var(--color-ink)] tracking-tight">{c.footer.brand}</p>
          <div className="flex items-center gap-6">
            <Link href="/politique-confidentialite" className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">{c.footer.privacy}</Link>
            <Link href="/register" className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">{c.footer.register}</Link>
            <Link href="/login" className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">{c.footer.login}</Link>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)]">{c.footer.copy(year)}</p>
        </div>
      </footer>
    </div>
  );
}

// ── Nav adaptée ───────────────────────────────────────────────────────────────

type ProvEntry = [string, typeof PROVINCES_INFO[string]];

function LandingNav({ multiProvince, lang, province, provCanada, provFrancophonie, onProvinceChange, onLangToggle, c, mounted }: {
  multiProvince: boolean;
  lang: Lang;
  province: string;
  provCanada: ProvEntry[];
  provFrancophonie: ProvEntry[];
  onProvinceChange: (code: string) => void;
  onLangToggle: () => void;
  c: { login: string; register: string };
  mounted: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const provinceInfo = PROVINCES_INFO[province] ?? PROVINCES_INFO.QC;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[var(--color-paper)]/95 backdrop-blur-md shadow-[0_1px_24px_rgba(15,22,35,0.07)] border-b border-[var(--color-rule)]" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-black text-[var(--color-ink)] tracking-tight hover:opacity-75 transition-opacity">
          ✦ ÉduRéussite
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {/* Sélecteur province compact dans la nav (quand scrollé) */}
          {multiProvince && mounted && scrolled && (
            <select
              value={province}
              onChange={(e) => onProvinceChange(e.target.value)}
              className="rounded-lg border border-[var(--color-rule)] bg-white/80 px-2 py-1 text-xs font-semibold text-[var(--color-ink)] focus:outline-none mr-2"
            >
              {provCanada.length > 0 && (
                <optgroup label="🇨🇦 Canada">
                  {provCanada.map(([code, info]) => (
                    <option key={code} value={code}>{code} — {lang === "FR" ? info.nom : info.nomEN}</option>
                  ))}
                </optgroup>
              )}
              {provFrancophonie.length > 0 && (
                <optgroup label={lang === "FR" ? "🌍 France & Afrique" : "🌍 France & Africa"}>
                  {provFrancophonie.map(([code, info]) => (
                    <option key={code} value={code}>{code} — {lang === "FR" ? info.nom : info.nomEN}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          {/* Bouton langue (NB bilingue ou langue non native de la province) */}
          {multiProvince && mounted && (province === "NB" || provinceInfo.langue !== lang) && (
            <button
              onClick={onLangToggle}
              className="rounded-lg border border-[var(--color-rule)] bg-white/80 px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
            >
              {lang === "FR" ? "EN" : "FR"}
            </button>
          )}
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors">{c.login}</Link>
          <Link href="/register" className="rounded-xl bg-[var(--color-ink)] px-5 py-2 text-sm font-bold text-white hover:opacity-85 transition-opacity shadow-sm">{c.register}</Link>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[var(--color-paper-warm)] transition-colors" aria-label="Menu">
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--color-ink)] transition-all duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-rule)] bg-[var(--color-paper)] px-6 py-4 space-y-2">
          {multiProvince && mounted && (
            <select value={province} onChange={(e) => { onProvinceChange(e.target.value); setMenuOpen(false); }}
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm font-medium text-[var(--color-ink)] mb-1">
              {provCanada.length > 0 && (
                <optgroup label="🇨🇦 Canada">
                  {provCanada.map(([code, info]) => (
                    <option key={code} value={code}>{lang === "FR" ? info.nom : info.nomEN}</option>
                  ))}
                </optgroup>
              )}
              {provFrancophonie.length > 0 && (
                <optgroup label={lang === "FR" ? "🌍 France & Afrique" : "🌍 France & Africa"}>
                  {provFrancophonie.map(([code, info]) => (
                    <option key={code} value={code}>{lang === "FR" ? info.nom : info.nomEN}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-xl border border-[var(--color-rule)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">{c.login}</Link>
          <Link href="/register" onClick={() => setMenuOpen(false)} className="block rounded-xl bg-[var(--color-ink)] px-4 py-3 text-center text-sm font-bold text-white">{c.register}</Link>
        </div>
      )}
    </header>
  );
}

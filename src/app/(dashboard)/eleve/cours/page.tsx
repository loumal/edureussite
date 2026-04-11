export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { CoursStructure } from "@/lib/ai/cours";

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "✏️", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🗣️", EDUCATION_PHYSIQUE: "🏃",
};

const STATUT_CONFIG = {
  NON_LU: {
    label: "Nouveau cours",
    badge: "bg-[var(--color-accent)] text-white",
    border: "border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.03)]",
    cta: "Commencer →",
    ctaClass: "bg-[var(--color-accent)] text-white hover:opacity-90",
    dot: "bg-[var(--color-accent)]",
  },
  EN_COURS: {
    label: "En cours",
    badge: "bg-[rgba(201,149,42,0.15)] text-[var(--color-gold)]",
    border: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.03)]",
    cta: "Continuer →",
    ctaClass: "bg-[var(--color-gold)] text-white hover:opacity-90",
    dot: "bg-[var(--color-gold)]",
  },
  TERMINE: {
    label: "Terminé",
    badge: "bg-[rgba(42,124,111,0.12)] text-[var(--color-success)]",
    border: "border-[var(--color-rule)] bg-white opacity-80",
    cta: "Revoir →",
    ctaClass: "bg-[var(--color-paper-warm)] text-[var(--color-ink)] border border-[var(--color-rule)] hover:bg-white",
    dot: "bg-[var(--color-success)]",
  },
};

export default async function MesCoursPage() {
  await requireRole(["ELEVE"]);

  const { profil } = await api.eleve.getDashboard();
  if (!profil) return null;

  const cours = await api.cours.getMesCours();

  const nonLus    = cours.filter((c) => c.statut === "NON_LU");
  const enCours   = cours.filter((c) => c.statut === "EN_COURS");
  const termines  = cours.filter((c) => c.statut === "TERMINE");

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/eleve"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Tableau de bord
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-[var(--color-ink)]">
                📚 Mes cours personnalisés
              </h1>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                Des leçons créées spécialement pour <strong>{profil.prenom}</strong> en fonction de tes erreurs et de tes difficultés.
              </p>
            </div>
            {nonLus.length > 0 && (
              <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-sm font-bold text-white flex-shrink-0">
                {nonLus.length} nouveau{nonLus.length > 1 ? "x" : ""}
              </span>
            )}
          </div>
        </div>

        {cours.length === 0 ? (
          /* ── État vide ── */
          <div className="space-y-6">
            <Card className="p-10 text-center">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-xl font-black text-[var(--color-ink)] mb-3">
                Tes cours arrivent bientôt !
              </h2>
              <p className="text-sm text-[var(--color-ink-soft)] max-w-md mx-auto mb-2 leading-relaxed">
                Chaque fois que tu complètes <strong>3 exercices</strong>, ton IA personnelle analyse tes erreurs et crée un cours sur mesure pour t'expliquer ce que tu n'as pas encore bien compris.
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] max-w-sm mx-auto leading-relaxed">
                Le cours utilise tes centres d'intérêt pour les exemples, et des techniques de recherche éprouvées pour t'aider à vraiment comprendre — pas juste mémoriser.
              </p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <Link
                  href="/eleve"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  ✏️ Faire des exercices maintenant
                </Link>
              </div>
            </Card>

            {/* Explication du fonctionnement */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-[var(--color-ink)] mb-4">
                Comment fonctionnent les cours personnalisés ?
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    num: "1",
                    emoji: "✏️",
                    titre: "Tu fais des exercices",
                    desc: "Sur les matières de ton plan d'action.",
                  },
                  {
                    num: "2",
                    emoji: "🔬",
                    titre: "L'IA analyse tes erreurs",
                    desc: "Après 3 exercices, elle identifie exactement ce qui te bloque.",
                  },
                  {
                    num: "3",
                    emoji: "📚",
                    titre: "Un cours sur mesure apparaît",
                    desc: "Avec des explications claires, des exemples dans ton univers, et des exercices pour vérifier.",
                  },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-bold text-white">
                      {step.num}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {step.emoji} {step.titre}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Nouveaux cours ── */}
            {nonLus.length > 0 && (
              <Section titre="🔴 Nouveaux cours — à lire" sous={`${nonLus.length} cours t'attendent`}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {nonLus.map((c) => (
                    <CoursCard key={c.id} cours={c} statut="NON_LU" />
                  ))}
                </div>
              </Section>
            )}

            {/* ── En cours ── */}
            {enCours.length > 0 && (
              <Section titre="🟡 En cours" sous="Continue là où tu t'es arrêté">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {enCours.map((c) => (
                    <CoursCard key={c.id} cours={c} statut="EN_COURS" />
                  ))}
                </div>
              </Section>
            )}

            {/* ── Terminés ── */}
            {termines.length > 0 && (
              <Section titre="✅ Cours terminés" sous={`${termines.length} cours complété${termines.length > 1 ? "s" : ""}`}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {termines.map((c) => (
                    <CoursCard key={c.id} cours={c} statut="TERMINE" />
                  ))}
                </div>
              </Section>
            )}

            {/* Encadré explicatif */}
            <div className="rounded-2xl border border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)] px-5 py-4">
              <p className="text-xs font-bold text-[var(--color-purple)] mb-1">💡 Comment obtenir plus de cours ?</p>
              <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                Un nouveau cours est créé automatiquement après chaque groupe de <strong>3 exercices complétés</strong>. Plus tu pratiques, plus tu reçois de cours adaptés à tes erreurs du moment. Tu peux aussi signaler tes difficultés dans la section « Parle à ton IA » sur ton tableau de bord.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

type CoursRecord = Awaited<ReturnType<typeof api.cours.getMesCours>>[0];

function CoursCard({ cours: c, statut }: { cours: CoursRecord; statut: keyof typeof STATUT_CONFIG }) {
  const contenu = c.contenu as unknown as CoursStructure;
  const cfg = STATUT_CONFIG[statut];

  const matieresPrincipales = (c.matieres as string[]).slice(0, 2);
  const emoji = matieresPrincipales.length > 0
    ? (MATIERES_EMOJI[matieresPrincipales[0]] ?? "📘")
    : "📘";

  const labelsMatieres = (c.matieres as string[])
    .map((m) => MATIERES_LABELS[m] ?? m)
    .join(", ");

  const dateStr = new Date(c.createdAt).toLocaleDateString("fr-CA", {
    day: "numeric", month: "long",
  });

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-sm ${cfg.border}`}>
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-[var(--color-ink)] text-sm leading-snug">
              {contenu.titre ?? "Cours personnalisé"}
            </p>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            {labelsMatieres}
          </p>
        </div>
      </div>

      {/* Infos */}
      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
        <span>⏱ ~{contenu.dureeEstimeeMinutes ?? 20} min</span>
        <span>·</span>
        <span>{contenu.lecon?.length ?? 0} étapes</span>
        <span>·</span>
        <span>{contenu.exercicesVerification?.length ?? 0} exercice{(contenu.exercicesVerification?.length ?? 0) > 1 ? "s" : ""}</span>
      </div>

      {/* Résumé des erreurs identifiées */}
      {contenu.erreursIdentifiees && contenu.erreursIdentifiees.length > 0 && (
        <div className="rounded-xl bg-[var(--color-paper-warm)] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
            Ce que ce cours va t'expliquer
          </p>
          <ul className="space-y-1">
            {contenu.erreursIdentifiees.slice(0, 2).map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-ink)]">
                <span className="mt-0.5 flex-shrink-0 text-[var(--color-accent)]">→</span>
                {e.erreur}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <p className="text-[10px] text-[var(--color-ink-soft)]">Créé le {dateStr}</p>
        <Link
          href={`/eleve/cours/${c.id}`}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-opacity ${cfg.ctaClass}`}
        >
          {cfg.cta}
        </Link>
      </div>
    </div>
  );
}

function Section({
  titre, sous, children,
}: {
  titre: string;
  sous: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-black text-[var(--color-ink)]">{titre}</h2>
        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{sous}</p>
      </div>
      {children}
    </div>
  );
}

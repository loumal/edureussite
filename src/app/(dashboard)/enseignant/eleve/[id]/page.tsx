import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEnseignant } from "@/components/layout/nav-enseignant";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CommentaireForm } from "@/components/enseignant/commentaire-form";

interface Props {
  params: Promise<{ id: string }>;
}

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🇨🇦", EDUCATION_PHYSIQUE: "⚽",
};

const ETATS_CONFIG: Record<string, { label: string; emoji: string }> = {
  TRES_BIEN: { label: "Très bien", emoji: "😄" },
  BIEN: { label: "Bien", emoji: "🙂" },
  CORRECT: { label: "Correct", emoji: "😐" },
  FATIGUE: { label: "Fatigué(e)", emoji: "😴" },
  STRESSE: { label: "Stressé(e)", emoji: "😰" },
  TRISTE: { label: "Triste", emoji: "😢" },
};

export default async function EleveDetailPage({ params }: Props) {
  await requireRole(["ENSEIGNANT", "ADMIN"]);
  const { id } = await params;

  const [{ profil: enseignant }, eleve] = await Promise.all([
    api.enseignant.getDashboard(),
    api.enseignant.getEleve({ eleveId: id }),
  ]);

  const nomEnseignant = enseignant
    ? `${enseignant.prenom} ${enseignant.nom}`
    : "Enseignant(e)";

  const exercicesTermines = eleve.exercicesAssignes.filter(
    (e: { statut: string }) => e.statut === "TERMINE"
  );
  const scores = exercicesTermines
    .map((e: { score: number | null }) => e.score)
    .filter((s: number | null): s is number => s !== null);
  const scoreMoyen =
    scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : null;

  const planActif = eleve.planActions[0] ?? null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEnseignant nom={nomEnseignant} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/enseignant"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← Retour à la liste
        </Link>

        {/* En-tête élève */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-2xl font-black text-white">
            {eleve.prenom.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              {eleve.prenom} {eleve.nom}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-ink-soft)]">
              <span>🎓 {eleve.niveauScolaire.replace("_", " ")}</span>
              {eleve.ecole && <span>🏫 {eleve.ecole}</span>}
              <span>🔥 {eleve.streakJours} jour{eleve.streakJours > 1 ? "s" : ""} de streak</span>
            </div>
          </div>
          {scoreMoyen !== null && (
            <div className="ml-auto text-center">
              <div
                className={`text-3xl font-black ${
                  scoreMoyen >= 75
                    ? "text-[var(--color-success)]"
                    : scoreMoyen >= 60
                    ? "text-[var(--color-gold)]"
                    : "text-[var(--color-accent)]"
                }`}
              >
                {scoreMoyen}%
              </div>
              <div className="text-xs text-[var(--color-ink-soft)]">Score moyen</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progression par matière */}
            {eleve.niveauxMatieres.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                  Progression par matière
                </h2>
                <div className="space-y-3">
                  {eleve.niveauxMatieres.map((nm: { matiere: string; scoreGlobal: number; niveau: string }) => (
                    <div key={nm.matiere} className="flex items-center gap-3">
                      <span className="text-lg w-6 flex-shrink-0">
                        {MATIERES_EMOJI[nm.matiere] ?? "📚"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--color-ink)]">
                            {MATIERES_LABELS[nm.matiere] ?? nm.matiere}
                          </span>
                          <span className="text-xs text-[var(--color-ink-soft)]">
                            {nm.scoreGlobal}%
                          </span>
                        </div>
                        <Progress
                          value={nm.scoreGlobal}
                          color={nm.scoreGlobal >= 75 ? "success" : nm.scoreGlobal >= 60 ? "gold" : "accent"}
                          size="sm"
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold flex-shrink-0 ${
                          nm.niveau === "AVANCE"
                            ? "text-[var(--color-success)]"
                            : nm.niveau === "EN_DIFFICULTE"
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-ink-soft)]"
                        }`}
                      >
                        {nm.niveau === "AVANCE" ? "Avancé" : nm.niveau === "EN_DIFFICULTE" ? "En difficulté" : "Attendu"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Derniers exercices */}
            <Card className="p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                Derniers exercices ({exercicesTermines.length} complétés)
              </h2>
              {exercicesTermines.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)] text-center py-4">
                  Aucun exercice complété encore
                </p>
              ) : (
                <div className="space-y-2">
                  {exercicesTermines.slice(0, 8).map((ex: {
                    id: string;
                    exercice: { titre: string; matiere: string; type: string };
                    score: number | null;
                    dateFin: Date | null;
                  }) => (
                    <div
                      key={ex.id}
                      className="flex items-center gap-3 py-2 border-b border-[var(--color-rule)] last:border-0"
                    >
                      <span className="text-lg">
                        {MATIERES_EMOJI[ex.exercice.matiere] ?? "📚"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                          {ex.exercice.titre}
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {ex.dateFin
                            ? new Date(ex.dateFin).toLocaleDateString("fr-CA", {
                                day: "numeric",
                                month: "short",
                              })
                            : ""}
                        </p>
                      </div>
                      {ex.score !== null && (
                        <span
                          className={`text-sm font-bold flex-shrink-0 ${
                            ex.score >= 75
                              ? "text-[var(--color-success)]"
                              : ex.score >= 60
                              ? "text-[var(--color-gold)]"
                              : "text-[var(--color-accent)]"
                          }`}
                        >
                          {Math.round(ex.score)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Formulaire de commentaire */}
            <Card className="p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                Ajouter un commentaire pédagogique
              </h2>
              <CommentaireForm eleveId={id} />
            </Card>
          </div>

          {/* Sidebar droite */}
          <div className="space-y-5">
            {/* Humeur récente */}
            {eleve.checkIns.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                  Humeur récente
                </h3>
                <div className="space-y-2">
                  {eleve.checkIns.slice(0, 5).map((ci: {
                    id: string;
                    etat: string;
                    date: Date;
                    note: string | null;
                  }) => {
                    const cfg = ETATS_CONFIG[ci.etat];
                    return (
                      <div key={ci.id} className="flex items-center gap-2">
                        <span className="text-xl">{cfg?.emoji ?? "❓"}</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[var(--color-ink)]">
                            {cfg?.label ?? ci.etat}
                          </p>
                          <p className="text-xs text-[var(--color-ink-soft)]">
                            {new Date(ci.date).toLocaleDateString("fr-CA", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Plan actif */}
            {planActif && (
              <Card className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                  Plan d'action actif
                </h3>
                <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
                  {planActif.titre}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] mb-3">
                  {planActif.objectifs.length} objectif
                  {planActif.objectifs.length > 1 ? "s" : ""}
                </p>
                <ul className="space-y-1">
                  {planActif.objectifs.slice(0, 3).map((obj: { id: string; titre: string }) => (
                    <li key={obj.id} className="flex items-start gap-1.5 text-xs text-[var(--color-ink-soft)]">
                      <span className="flex-shrink-0 text-[var(--color-success)]">✓</span>
                      {obj.titre}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Badges */}
            {eleve.badges.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                  Badges obtenus ({eleve.badges.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {eleve.badges.slice(0, 9).map((b) => (
                    <div
                      key={b.id}
                      title={b.badge.titre}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-paper-warm)] text-xl"
                    >
                      {b.badge.icone}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Adaptations */}
            {(eleve.tdah || eleve.dyslexie || eleve.anxieteScolaire) && (
              <Card className="p-4 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-3">
                  Adaptations requises
                </h3>
                <ul className="space-y-1">
                  {eleve.tdah && (
                    <li className="text-xs text-[var(--color-ink)]">
                      🧠 TDAH — sessions courtes
                    </li>
                  )}
                  {eleve.dyslexie && (
                    <li className="text-xs text-[var(--color-ink)]">
                      📝 Dyslexie — support visuel
                    </li>
                  )}
                  {eleve.anxieteScolaire && (
                    <li className="text-xs text-[var(--color-ink)]">
                      💙 Anxiété scolaire — progression douce
                    </li>
                  )}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import type { CoursStructure, EtapeLecon, ExerciceVerification } from "@/lib/ai/cours";
import { EnseignantIA } from "./enseignant-ia";

// Wrapper qui charge le quota hebdo Mira depuis la DB avant d'ouvrir la session
function EnseignantIAAvecQuota(props: Omit<React.ComponentProps<typeof EnseignantIA>, "miraSecsAlreadyUsed" | "miraSecsMax">) {
  const { data: quota } = trpc.eleve.getMiraQuota.useQuery();
  return (
    <EnseignantIA
      {...props}
      miraSecsAlreadyUsed={quota?.secsUsed ?? 0}
      miraSecsMax={quota?.secsMax ?? 30 * 60}
    />
  );
}

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "✏️", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🇬🇧", EDUCATION_PHYSIQUE: "🏃",
};

interface Props {
  coursId: string;
  cours: CoursStructure;
  statut: string;
  // Données pour la session IA
  prenom?: string;
  niveauLabel?: string;
  subjectContext?: string;
  profilExtra?: string;
}

export function CoursInteractif({ coursId, cours, statut, prenom, niveauLabel, subjectContext, profilExtra }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"classique" | "enseignant-ia">("classique");
  const [etapeActive, setEtapeActive] = useState(0); // 0=intro, 1..n=lecon, n+1=exercices, n+2=fin
  const [exerciceActif, setExerciceActif] = useState(0);
  const [reponsesExercices, setReponsesExercices] = useState<Record<number, string>>({});
  const [indicesVus, setIndicesVus] = useState<Record<number, number>>({});
  const [solutionsVues, setSolutionsVues] = useState<Record<number, boolean>>({});
  const [coursTermine, setCoursTermine] = useState(statut === "TERMINE");

  const majStatut = trpc.cours.majStatut.useMutation();

  const totalEtapes = cours.lecon.length;
  const phase: "intro" | "lecon" | "exercices" | "fin" =
    etapeActive === 0 ? "intro"
    : etapeActive <= totalEtapes ? "lecon"
    : etapeActive === totalEtapes + 1 ? "exercices"
    : "fin";

  const etapeLecon = phase === "lecon" ? cours.lecon[etapeActive - 1] : null;

  function avancer() {
    if (etapeActive === 0) {
      majStatut.mutate({ id: coursId, statut: "EN_COURS" });
    }
    setEtapeActive((p) => p + 1);
  }

  async function terminerCours() {
    await majStatut.mutateAsync({ id: coursId, statut: "TERMINE" });
    setCoursTermine(true);
    setEtapeActive(totalEtapes + 2);
  }

  const progressPct = Math.round((etapeActive / (totalEtapes + 2)) * 100);

  return (
    <div>
      {/* ── Toggle Mode 1 / Mode 2 ── */}
      <div className="mb-5 flex rounded-xl border border-[var(--color-rule)] bg-white p-1">
        <button
          onClick={() => setMode("classique")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${
            mode === "classique"
              ? "bg-[var(--color-ink)] text-white shadow-sm"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          📖 Mode lecture
        </button>
        <button
          onClick={() => setMode("enseignant-ia")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${
            mode === "enseignant-ia"
              ? "bg-[var(--color-ink)] text-white shadow-sm"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          <span className="text-[var(--color-gold)]">✦</span>
          Session avec Mira
        </button>
      </div>

      {/* ── Mode 2 : Session Enseignant IA ── */}
      {mode === "enseignant-ia" && (
        <EnseignantIAAvecQuota
          prenom={prenom ?? ""}
          niveauLabel={niveauLabel ?? ""}
          subjectContext={subjectContext ?? cours.titre}
          profilExtra={profilExtra}
          onClose={() => setMode("classique")}
        />
      )}

      {/* ── Mode 1 : contenu classique ── */}
      {mode === "classique" && (
      <>

      {/* ── En-tête ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{MATIERES_EMOJI[cours.matiere] ?? "📘"}</span>
          <div>
            <h1 className="text-xl font-black text-[var(--color-ink)] leading-tight">
              {cours.titre}
            </h1>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {cours.niveauDifficulte} · ⏱ ~{cours.dureeEstimeeMinutes} min
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--color-ink-soft)] mb-1">
            <span>Progression</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── PHASE INTRO ── */}
      {phase === "intro" && (
        <IntroSection cours={cours} onStart={avancer} />
      )}

      {/* ── PHASE LEÇON ── */}
      {phase === "lecon" && etapeLecon && (
        <EtapeSection
          etape={etapeLecon}
          numero={etapeActive}
          total={totalEtapes}
          onSuivant={avancer}
          estDerniere={etapeActive === totalEtapes}
        />
      )}

      {/* ── PHASE EXERCICES ── */}
      {phase === "exercices" && (
        <ExercicesSection
          exercices={cours.exercicesVerification}
          actif={exerciceActif}
          setActif={setExerciceActif}
          reponses={reponsesExercices}
          setReponses={setReponsesExercices}
          indicesVus={indicesVus}
          setIndicesVus={setIndicesVus}
          solutionsVues={solutionsVues}
          setSolutionsVues={setSolutionsVues}
          onTerminer={terminerCours}
          loading={majStatut.isPending}
        />
      )}

      {/* ── PHASE FIN ── */}
      {phase === "fin" && (
        <FinSection
          cours={cours}
          onRetour={() => router.push("/eleve")}
          onNouvelExercice={() => router.push("/eleve/exercices/nouveau")}
        />
      )}
      </>
      )}

    </div>
  );
}

// ─── Introduction ─────────────────────────────────────────────────────────────

function IntroSection({ cours, onStart }: { cours: CoursStructure; onStart: () => void }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Message d'intro */}
      <Card className="p-6 bg-gradient-to-br from-[rgba(91,79,207,0.08)] to-white border-[rgba(91,79,207,0.2)]">
        <div className="flex items-start gap-3">
          <span className="text-4xl flex-shrink-0">🤝</span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-2">
              Un message personnel pour toi
            </p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">
              {cours.introduction}
            </p>
          </div>
        </div>
      </Card>

      {/* Ce qu'on va corriger ensemble */}
      {cours.erreursIdentifiees.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            🔍 Ce qu'on va corriger ensemble
          </p>
          <div className="space-y-3">
            {cours.erreursIdentifiees.map((e, i) => (
              <div key={i} className="rounded-xl bg-[var(--color-paper-warm)] p-4">
                <p className="text-sm font-bold text-[var(--color-ink)] mb-1">
                  {e.erreur}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] mb-2 leading-relaxed">
                  {e.commentCaSeManifeste}
                </p>
                <div className="flex items-start gap-1.5 mt-2 p-2.5 rounded-lg bg-[rgba(42,124,111,0.07)]">
                  <span className="text-[var(--color-success)] text-sm flex-shrink-0">💚</span>
                  <p className="text-xs text-[var(--color-success)] font-medium leading-relaxed">
                    {e.pourquoiCestNormal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Plan du cours */}
      {cours.lecon.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            📋 Le plan de ta leçon
          </p>
          <div className="space-y-2">
            {cours.lecon.map((etape) => (
              <div key={etape.numero} className="flex items-center gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-xs font-bold text-[var(--color-ink-soft)]">
                  {etape.numero}
                </div>
                <p className="text-sm text-[var(--color-ink)]">{etape.titre}</p>
              </div>
            ))}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(217,79,43,0.1)] text-xs font-bold text-[var(--color-accent)]">
                ✓
              </div>
              <p className="text-sm text-[var(--color-ink-soft)]">Exercices de mise en pratique</p>
            </div>
          </div>
        </Card>
      )}

      {/* Bases pédagogiques */}
      {cours.basesPedagogiques.length > 0 && (
        <Card className="p-5 border-[rgba(42,124,111,0.2)] bg-[rgba(42,124,111,0.03)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-3">
            🎓 Pourquoi cette méthode fonctionne
          </p>
          <div className="space-y-3">
            {cours.basesPedagogiques.map((b, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{b.approche}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 leading-relaxed">{b.explication}</p>
                <p className="text-xs text-[var(--color-ink-soft)] italic mt-1">
                  Source : {b.chercheur} ({b.annee}) — {b.source}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button size="lg" className="w-full" onClick={onStart}>
        Commencer la leçon →
      </Button>
    </div>
  );
}

// ─── Étape de la leçon ────────────────────────────────────────────────────────

function EtapeSection({
  etape, numero, total, onSuivant, estDerniere,
}: {
  etape: EtapeLecon;
  numero: number;
  total: number;
  onSuivant: () => void;
  estDerniere: boolean;
}) {
  const [checkpointReponse, setCheckpointReponse] = useState("");
  const [checkpointSoumis, setCheckpointSoumis] = useState(false);
  const [reponseVue, setReponseVue] = useState(false);

  const peutAvancer = checkpointSoumis || reponseVue;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* En-tête étape */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-ink)] text-white font-black flex-shrink-0 text-sm">
          {etape.numero}
        </div>
        <div>
          <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-wider">
            Étape {etape.numero} sur {total}
          </p>
          <h2 className="text-lg font-black text-[var(--color-ink)]">{etape.titre}</h2>
        </div>
      </div>

      {/* Lien avec l'erreur — pourquoi on voit ça */}
      {etape.lienAvecErreur && (
        <div className="rounded-xl bg-[rgba(217,79,43,0.05)] border border-[rgba(217,79,43,0.2)] px-4 py-3 flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">🎯</span>
          <div>
            <p className="text-xs font-bold text-[var(--color-accent)] mb-0.5 uppercase tracking-wide">Pourquoi on voit ça</p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">{etape.lienAvecErreur}</p>
          </div>
        </div>
      )}

      {/* Explication */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">📖 Explication</p>
        </div>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed">{etape.explication}</p>
      </Card>

      {/* Analogie */}
      <Card className="p-5 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-1">
              Pour mieux comprendre
            </p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed italic">
              {etape.analogie}
            </p>
          </div>
        </div>
      </Card>

      {/* Démonstration pas à pas */}
      <Card className="p-5 border-[rgba(42,124,111,0.2)] bg-[rgba(42,124,111,0.03)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-3">
          ✍️ Démarche pas à pas
        </p>
        <div className="bg-white rounded-xl border border-[var(--color-rule)] p-4">
          <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line font-mono">
            {etape.demonstration}
          </p>
        </div>
      </Card>

      {/* Point clé */}
      <div className="rounded-2xl bg-[var(--color-ink)] px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-xs font-bold uppercase tracking-wider text-white/60">
            ⭐ À retenir absolument
          </p>
        </div>
        <p className="text-sm font-semibold text-white leading-relaxed">{etape.pointCle}</p>
      </div>

      {/* Checkpoint interactif */}
      <Card className="p-5 border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.04)]">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-lg flex-shrink-0">🧠</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">
              Mini-test — vérifie ta compréhension
            </p>
            <p className="text-sm font-semibold text-[var(--color-ink)] leading-relaxed">
              {etape.checkpoint}
            </p>
          </div>
        </div>

        {!checkpointSoumis ? (
          <>
            <textarea
              value={checkpointReponse}
              onChange={(e) => setCheckpointReponse(e.target.value)}
              rows={3}
              placeholder="Écris ta réponse ici… prends le temps de réfléchir."
              className="w-full rounded-xl border border-[rgba(91,79,207,0.3)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple)] resize-none mb-3"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setCheckpointSoumis(true)}
                disabled={!checkpointReponse.trim()}
              >
                Vérifier ma réponse →
              </Button>
              {!reponseVue && (
                <button
                  onClick={() => { setReponseVue(true); setCheckpointSoumis(true); }}
                  className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline px-2"
                >
                  Voir directement la réponse
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {checkpointReponse.trim() && (
              <div className="rounded-xl bg-white border border-[var(--color-rule)] px-4 py-3">
                <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">Ta réponse</p>
                <p className="text-sm text-[var(--color-ink)] italic">{checkpointReponse}</p>
              </div>
            )}
            <div className="rounded-xl bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.25)] px-4 py-3">
              <p className="text-xs font-bold text-[var(--color-success)] mb-1">✅ La bonne réponse</p>
              <p className="text-sm text-[var(--color-ink)] font-medium leading-relaxed">
                {etape.checkpointReponse}
              </p>
            </div>
            <div className="rounded-xl bg-[rgba(91,79,207,0.06)] px-4 py-3">
              <p className="text-xs font-bold text-[var(--color-purple)] mb-1">💬 Explication</p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                {etape.checkpointExplication}
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-soft)] italic text-center">
              Peu importe ta réponse — ce qui compte, c'est que tu aies essayé. 🌱
            </p>
          </div>
        )}
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={onSuivant}
        disabled={!peutAvancer}
      >
        {!peutAvancer
          ? "Tente le mini-test pour continuer →"
          : estDerniere
            ? "Passer aux exercices de pratique →"
            : "Étape suivante →"}
      </Button>

      {!peutAvancer && (
        <p className="text-center text-xs text-[var(--color-ink-soft)]">
          Réponds au mini-test ci-dessus (ou clique &quot;Voir directement la réponse&quot;) pour débloquer la suite.
        </p>
      )}
    </div>
  );
}

// ─── Exercices de vérification ────────────────────────────────────────────────

function ExercicesSection({
  exercices, actif, setActif, reponses, setReponses,
  indicesVus, setIndicesVus, solutionsVues, setSolutionsVues,
  onTerminer, loading,
}: {
  exercices: ExerciceVerification[];
  actif: number;
  setActif: (n: number) => void;
  reponses: Record<number, string>;
  setReponses: (r: Record<number, string>) => void;
  indicesVus: Record<number, number>;
  setIndicesVus: (v: Record<number, number>) => void;
  solutionsVues: Record<number, boolean>;
  setSolutionsVues: (v: Record<number, boolean>) => void;
  onTerminer: () => void;
  loading: boolean;
}) {
  if (exercices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg font-bold text-[var(--color-ink)] mb-4">
          🎉 Leçon terminée ! Tu as tout assimilé !
        </p>
        <Button size="lg" onClick={onTerminer} loading={loading}>
          Terminer le cours ✓
        </Button>
      </div>
    );
  }

  const ex = exercices[actif];
  if (!ex) return null;

  const nbIndicesVus = indicesVus[actif] ?? 0;
  const solutionVue = solutionsVues[actif] ?? false;
  const estDernier = actif === exercices.length - 1;
  const aRepondu = !!(reponses[actif] ?? "").trim();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête exercice */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-white font-black flex-shrink-0 text-sm">
          {actif + 1}
        </div>
        <div>
          <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-wider">
            Exercice {actif + 1} sur {exercices.length}
          </p>
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Mets en pratique ce que tu viens d&apos;apprendre
          </p>
        </div>
      </div>

      {/* Petit rappel encourageant */}
      <div className="rounded-xl bg-[rgba(91,79,207,0.05)] border border-[rgba(91,79,207,0.15)] px-4 py-3">
        <p className="text-xs text-[var(--color-purple)] leading-relaxed">
          💪 Utilise la démarche vue dans la leçon. Si tu es bloqué(e), les indices sont là pour t&apos;aider — sans te donner la réponse directement.
        </p>
      </div>

      {/* Énoncé */}
      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">📝 Question</p>
        <p className="text-sm font-semibold text-[var(--color-ink)] leading-relaxed">
          {ex.enonce}
        </p>
      </Card>

      {/* Réponse */}
      <textarea
        value={reponses[actif] ?? ""}
        onChange={(e) => setReponses({ ...reponses, [actif]: e.target.value })}
        rows={4}
        placeholder="Écris ta démarche et ta réponse ici… montre comment tu raisonnes."
        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple)] resize-none"
      />

      {/* Indices progressifs */}
      {ex.indices.length > 0 && nbIndicesVus < ex.indices.length && (
        <button
          onClick={() => setIndicesVus({ ...indicesVus, [actif]: nbIndicesVus + 1 })}
          className="w-full rounded-xl border-2 border-dashed border-[var(--color-gold)] py-3 text-sm font-semibold text-[var(--color-gold)] hover:bg-[rgba(201,149,42,0.06)] transition-colors"
        >
          💡 Besoin d&apos;un coup de pouce ? ({nbIndicesVus}/{ex.indices.length})
        </button>
      )}

      {[...Array(nbIndicesVus)].map((_, i) => (
        <Card key={i} className="p-4 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]">
          <p className="text-xs font-bold text-[var(--color-gold)] mb-1">Indice {i + 1}</p>
          <p className="text-sm text-[var(--color-ink)]">{ex.indices[i]}</p>
        </Card>
      ))}

      {/* Voir la solution */}
      {aRepondu && !solutionVue && (
        <button
          onClick={() => setSolutionsVues({ ...solutionsVues, [actif]: true })}
          className="w-full rounded-xl border border-[var(--color-rule)] py-3 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors"
        >
          Voir la correction complète →
        </button>
      )}

      {!aRepondu && !solutionVue && (
        <button
          onClick={() => setSolutionsVues({ ...solutionsVues, [actif]: true })}
          className="text-xs text-[var(--color-ink-soft)] underline hover:text-[var(--color-ink)] transition-colors w-full text-center"
        >
          Voir directement la solution
        </button>
      )}

      {solutionVue && (
        <Card className="p-5 space-y-4 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)] animate-fade-in">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-2">
              ✅ Solution complète
            </p>
            <div className="bg-white rounded-xl border border-[var(--color-rule)] p-4">
              <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line font-mono">
                {ex.solution}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-1">
              💬 Pourquoi cette réponse ?
            </p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">
              {ex.explicationSolution}
            </p>
          </div>
          <div className="rounded-xl bg-[rgba(42,124,111,0.12)] p-4">
            <p className="text-sm font-semibold text-[var(--color-success)] leading-relaxed">
              🌟 {ex.encouragement}
            </p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      {!estDernier ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setActif(actif + 1)}
          disabled={!aRepondu && !solutionVue}
        >
          Exercice suivant →
        </Button>
      ) : (
        <Button
          size="lg"
          variant="success"
          className="w-full"
          onClick={onTerminer}
          loading={loading}
          disabled={!aRepondu && !solutionVue}
        >
          🎉 Terminer le cours !
        </Button>
      )}

      {!aRepondu && !solutionVue && (
        <p className="text-center text-xs text-[var(--color-ink-soft)]">
          Écris ta réponse (ou clique &quot;Voir directement la solution&quot;) pour continuer.
        </p>
      )}
    </div>
  );
}

// ─── Fin du cours ─────────────────────────────────────────────────────────────

function FinSection({
  cours, onRetour, onNouvelExercice,
}: {
  cours: CoursStructure;
  onRetour: () => void;
  onNouvelExercice: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in text-center">
      <div className="text-6xl animate-celebrate">🏆</div>

      <Card className="p-6 bg-gradient-to-br from-[rgba(42,124,111,0.08)] to-white border-[rgba(42,124,111,0.3)]">
        <p className="text-lg font-black text-[var(--color-ink)] mb-3">
          Cours terminé — Bravo !
        </p>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed">
          {cours.messageEncouragement}
        </p>
      </Card>

      {/* Astuces mémo à conserver */}
      {cours.astucesMnemotechniques.length > 0 && (
        <Card className="p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-3">
            🧠 Astuces à retenir
          </p>
          <ul className="space-y-2">
            {cours.astucesMnemotechniques.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink)] leading-relaxed">
                <span className="text-[var(--color-purple)] flex-shrink-0 mt-0.5">✦</span>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5 text-left border-[rgba(217,79,43,0.2)] bg-[rgba(217,79,43,0.04)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] mb-1">
          🗺️ Prochain défi
        </p>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed">{cours.prochainDefi}</p>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onRetour}>
          Tableau de bord
        </Button>
        <Button size="lg" className="flex-[2]" onClick={onNouvelExercice}>
          Nouvel exercice →
        </Button>
      </div>
    </div>
  );
}

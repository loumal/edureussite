"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EpreuveGeneree, QuestionEpreuve } from "@/lib/ai/exercice";

interface Props {
  assignationId: string;
  epreuve: EpreuveGeneree;
  statut: string;
  feedbackIA: Record<string, unknown> | null;
  reponsesSauvegardees?: Record<string, string> | null;
  prenom: string;
}

type Reponses = Record<string, string>;

interface EtapeCorrection {
  titre: string;
  explication: string;
  solution?: string;
  erreurEleve?: string;
  rappelTheorique?: string;
  conseil?: string;
}

interface CorrectionQuestion {
  bonne: boolean;
  pointsObtenus?: number;
  explication: string;
  etapes?: EtapeCorrection[];
  methodeOfficielle?: string;
  competencePFEQ?: string;
  astuceMemoire?: string;
}

interface FeedbackEpreuve {
  score?: number;
  mention?: string;
  correctionParQuestion?: Record<string, CorrectionQuestion>;
  ceQueJaiReussi?: string;
  encouragement?: string;
  prochainePiste?: string;
}

export function EpreuveInteractive({ assignationId, epreuve, statut, feedbackIA, reponsesSauvegardees, prenom }: Props) {
  const router = useRouter();
  // Si déjà terminé, initialiser avec les réponses sauvegardées en DB
  const [reponses, setReponses] = useState<Reponses>(
    statut === "TERMINE" && reponsesSauvegardees ? reponsesSauvegardees : {}
  );
  const [partieActive, setPartieActive] = useState(0);
  const [temps, setTemps] = useState(0);
  const [soumis, setSoumis] = useState(statut === "TERMINE");

  useEffect(() => {
    if (soumis) return;
    const t = setInterval(() => setTemps((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [soumis]);

  const soumettre = trpc.exercice.soumettre.useMutation({
    onSuccess: () => {
      jouerSonNotification();
      setSoumis(true);
      router.refresh();
    },
  });

  const handleSoumettre = () => {
    soumettre.mutate({
      exerciceAssigneId: assignationId,
      reponse: reponses,
      tempsSecondes: temps,
    });
  };

  const partieActuelle = epreuve.parties[partieActive];
  const totalRepondues = Object.keys(reponses).length;
  const totalQuestions = epreuve.parties.reduce((sum, p) => sum + p.questions.length, 0);
  const toutesVides = Object.values(reponses).every((r) => !r || r.trim() === "");
  const formatTemps = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const feedbackBrut: FeedbackEpreuve | null =
    (soumettre.data?.feedback as FeedbackEpreuve | undefined) ??
    (feedbackIA as FeedbackEpreuve | null);

  /* ── Feedback affiché si terminé ── */
  if (soumis && feedbackBrut) {
    return (
      <FeedbackEpreuvePanel
        feedback={feedbackBrut}
        epreuve={epreuve}
        reponses={reponses}
      />
    );
  }

  /* ── Correction en cours ── */
  if (soumettre.isPending) {
    return <CorrectionEnCours />;
  }

  /* ── Épreuve en cours ── */
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[rgba(91,79,207,0.12)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-purple)]">
              📋 Épreuve complète
            </span>
            <span className="text-xs text-[var(--color-ink-soft)]">{epreuve.dureeMinutes} min · {epreuve.totalPoints} pts</span>
          </div>
          <h1 className="text-xl font-black text-[var(--color-ink)]">{epreuve.titre}</h1>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-black text-[var(--color-ink)] font-mono">{formatTemps(temps)}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{totalRepondues}/{totalQuestions} répondues</p>
        </div>
      </div>

      {epreuve.notionsCiblees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {epreuve.notionsCiblees.map((n, i) => (
            <span key={i} className="rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-0.5 text-xs text-[var(--color-ink-soft)]">
              {n}
            </span>
          ))}
        </div>
      )}

      <Card className="p-5 border-l-4 border-[var(--color-purple)] bg-[rgba(91,79,207,0.03)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-2">📖 Mise en situation</p>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">{epreuve.miseEnSituation}</p>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {epreuve.parties.map((p, i) => (
          <button key={p.numero} onClick={() => setPartieActive(i)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              partieActive === i
                ? "bg-[var(--color-ink)] text-white"
                : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
            }`}
          >
            Partie {p.numero} · {p.points} pts
          </button>
        ))}
      </div>

      {partieActuelle && (
        <Card className="overflow-hidden">
          <div className="bg-[var(--color-paper-warm)] px-5 py-4 border-b border-[var(--color-rule)]">
            <h2 className="text-base font-black text-[var(--color-ink)]">{partieActuelle.titre}</h2>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{partieActuelle.description} · {partieActuelle.points} points</p>
          </div>
          <div className="divide-y divide-[var(--color-rule)]">
            {partieActuelle.questions.map((q, qi) => (
              <QuestionBlock
                key={q.id}
                question={q}
                numero={qi + 1}
                valeur={reponses[q.id] ?? ""}
                onChange={(val) => setReponses((prev) => ({ ...prev, [q.id]: val }))}
              />
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPartieActive((i) => Math.max(0, i - 1))} disabled={partieActive === 0}>
          ← Partie précédente
        </Button>
        {partieActive < epreuve.parties.length - 1 ? (
          <Button onClick={() => setPartieActive((i) => i + 1)}>
            Partie suivante →
          </Button>
        ) : (
          <Button
            onClick={handleSoumettre}
            disabled={soumettre.isPending || totalRepondues < totalQuestions || toutesVides}
            className="bg-[var(--color-success)]"
          >
            {`Remettre l'épreuve ✓`}
          </Button>
        )}
      </div>

      {totalRepondues < totalQuestions && partieActive === epreuve.parties.length - 1 && (
        <p className="text-center text-xs text-[var(--color-accent)]">
          ⚠️ {totalQuestions - totalRepondues} question{totalQuestions - totalRepondues > 1 ? "s" : ""} sans réponse
        </p>
      )}
      {totalRepondues === totalQuestions && toutesVides && partieActive === epreuve.parties.length - 1 && (
        <p className="text-center text-xs text-[var(--color-accent)]">
          ⚠️ Tu dois répondre à au moins une question avant de remettre l&apos;épreuve.
        </p>
      )}

      {soumettre.isError && (
        <div className="text-center">
          <p className="text-sm text-[var(--color-accent)]">Une erreur s&apos;est produite. Réessaie.</p>
          {soumettre.error?.message && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-1 font-mono">{soumettre.error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SON DE NOTIFICATION
══════════════════════════════════════════════════════════════ */

function jouerSonNotification() {
  try {
    const ctx = new AudioContext();
    // Accord joyeux montant : Do–Mi–Sol–Do (C5-E5-G5-C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    // AudioContext non disponible (ex: SSR)
  }
}

/* ══════════════════════════════════════════════════════════════
   ÉCRAN DE CHARGEMENT LUDIQUE
══════════════════════════════════════════════════════════════ */

const MESSAGES_CORRECTION = [
  { emoji: "🔍", texte: "L'IA lit tes réponses attentivement…" },
  { emoji: "🧮", texte: "Elle calcule tes points un par un…" },
  { emoji: "📚", texte: "Elle consulte ses livres de mathématiques…" },
  { emoji: "🤔", texte: "Elle réfléchit très fort pour toi…" },
  { emoji: "✏️", texte: "Elle prépare tes commentaires personnalisés…" },
  { emoji: "🎯", texte: "Elle vérifie chaque réponse avec soin…" },
  { emoji: "💡", texte: "Elle cherche des conseils juste pour toi…" },
  { emoji: "🌟", texte: "La correction sera bientôt prête…" },
];

function CorrectionEnCours() {
  const [secondes, setSecondes] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIndex((i) => (i + 1) % MESSAGES_CORRECTION.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  const MAX_SECONDES = 360; // 6 minutes
  const progression = Math.min(secondes / MAX_SECONDES, 0.98);
  const minutesEcoulees = Math.floor(secondes / 60);
  const minutesRestantes = Math.max(1, Math.ceil((MAX_SECONDES - secondes) / 60));

  const rayon = 52;
  const circonf = 2 * Math.PI * rayon;
  const dashOffset = circonf * (1 - progression);

  const { emoji, texte } = MESSAGES_CORRECTION[msgIndex];

  return (
    <div className="flex flex-col items-center justify-center py-14 space-y-7">
      {/* Cercle de progression SVG */}
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          {/* Piste de fond */}
          <circle
            cx="60" cy="60" r={rayon}
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth="9"
          />
          {/* Arc de progression */}
          <circle
            cx="60" cy="60" r={rayon}
            fill="none"
            stroke="var(--color-purple)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circonf}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        {/* Emoji rotatif au centre */}
        <div
          className="absolute inset-0 flex items-center justify-center text-4xl"
          style={{ transition: "opacity 0.4s" }}
          key={msgIndex}
        >
          {emoji}
        </div>
      </div>

      {/* Titres */}
      <div className="text-center space-y-1.5">
        <p className="text-xl font-black text-[var(--color-ink)]">Correction en cours…</p>
        <p
          className="text-sm text-[var(--color-ink-soft)] min-h-[1.25rem]"
          key={msgIndex}
          style={{ animation: "fadeIn 0.4s ease" }}
        >
          {texte}
        </p>
      </div>

      {/* Infos temps */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
          ⏱ Cette correction peut prendre de 2 à 6 minutes
        </p>
        {secondes >= 10 && (
          <p className="text-xs text-[var(--color-ink-soft)]">
            {minutesEcoulees > 0
              ? `${minutesEcoulees} min écoulée${minutesEcoulees > 1 ? "s" : ""} · encore ~${minutesRestantes} min`
              : `~${minutesRestantes} min restante${minutesRestantes > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Message d'encouragement après 2 min */}
      {secondes >= 120 && (
        <p className="text-xs text-center text-[var(--color-purple)] font-semibold max-w-xs animate-pulse">
          🙏 Merci pour ta patience ! Une bonne correction prend du temps.
        </p>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PANNEAU DE FEEDBACK COMPLET
══════════════════════════════════════════════════════════════ */

function FeedbackEpreuvePanel({
  feedback,
  epreuve,
  reponses,
}: {
  feedback: FeedbackEpreuve;
  epreuve: EpreuveGeneree;
  reponses: Reponses;
}) {
  const score = feedback.score ?? 0;
  const scoreColor = score >= 80 ? "success" : score >= 60 ? "gold" : "accent";
  const [partieOuverte, setPartieOuverte] = useState<number>(0);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Score global ── */}
      <Card className="overflow-hidden p-0">
        <div className={`p-7 text-center ${
          score >= 80 ? "bg-gradient-to-br from-[rgba(42,124,111,0.08)] to-white"
          : score >= 60 ? "bg-gradient-to-br from-[rgba(201,149,42,0.08)] to-white"
          : "bg-gradient-to-br from-[rgba(217,79,43,0.06)] to-white"
        }`}>
          <div className="text-5xl mb-3">
            {score >= 90 ? "🌟" : score >= 75 ? "🏆" : score >= 60 ? "👍" : "💪"}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)] mb-1">
            {feedback.mention ?? (score >= 80 ? "Excellent !" : score >= 60 ? "Bien !" : "En progression")}
          </p>
          <div className="text-5xl font-black text-[var(--color-ink)] mb-1">
            {Math.round(score)}<span className="text-2xl font-medium text-[var(--color-ink-soft)]">/100</span>
          </div>
          <div className="mx-auto max-w-xs mt-3 mb-2">
            <Progress value={score} color={scoreColor} size="lg" />
          </div>
        </div>

        {/* Ce que j'ai réussi */}
        {feedback.ceQueJaiReussi && (
          <div className="border-t border-[var(--color-rule)] px-6 py-4 bg-[rgba(42,124,111,0.03)]">
            <div className="flex items-start gap-2.5">
              <span className="text-lg flex-shrink-0">✅</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-0.5">
                  Ce que tu as bien réussi
                </p>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.ceQueJaiReussi}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Correction détaillée par partie ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📐</span>
          <h3 className="text-base font-black text-[var(--color-ink)]">Correction détaillée — question par question</h3>
        </div>

        {/* Onglets parties */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {epreuve.parties.map((p, i) => {
            const bonnes = p.questions.filter((q) => {
              const corr = feedback.correctionParQuestion?.[q.id];
              // Réévaluer localement si pas d'étapes (ancien feedback potentiellement erroné)
              return corr?.etapes !== undefined
                ? corr.bonne
                : evaluerBonneReponse(q, reponses[q.id]);
            }).length;
            return (
              <button
                key={p.numero}
                onClick={() => setPartieOuverte(i)}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  partieOuverte === i
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
                }`}
              >
                Partie {p.numero}
                <span className={`ml-1.5 ${partieOuverte === i ? "text-white/70" : "text-[var(--color-ink-soft)]"}`}>
                  {bonnes}/{p.questions.length} ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* Questions de la partie active */}
        {epreuve.parties[partieOuverte] && (
          <div className="space-y-3">
            {epreuve.parties[partieOuverte].questions.map((q, qi) => (
              <QuestionCorrection
                key={q.id}
                question={q}
                numero={qi + 1}
                correction={feedback.correctionParQuestion?.[q.id]}
                reponseEleve={reponses[q.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Prochaine piste ── */}
      {feedback.prochainePiste && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🗺️</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                Pour progresser
              </p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{feedback.prochainePiste}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Encouragement ── */}
      {feedback.encouragement && (
        <div className="rounded-2xl bg-[var(--color-ink)] p-5 text-center">
          <p className="text-base font-semibold text-white leading-relaxed">{feedback.encouragement}</p>
        </div>
      )}

      <div className="flex gap-3">
        <a href="/eleve" className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">← Tableau de bord</Button>
        </a>
        <a href="/eleve/exercices/nouveau" className="flex-[2]">
          <Button size="lg" className="w-full">Nouvel exercice ✨</Button>
        </a>
      </div>
    </div>
  );
}

/* ── Réévaluation locale fiable (pour anciens feedbacks sans étapes) ── */
function evaluerBonneReponse(question: QuestionEpreuve, reponse: string | undefined): boolean {
  if (!reponse || reponse.trim() === "") return false;
  const rep = reponse.trim();
  if (question.type === "QCM" && question.choix) {
    const optionCorrecte = question.choix.find(
      (c) => c.lettre.toUpperCase() === question.reponseAttendue.trim().toUpperCase()
    );
    if (!optionCorrecte) return false;
    return (
      rep.toUpperCase() === optionCorrecte.lettre.toUpperCase() ||
      rep.toLowerCase() === optionCorrecte.texte.toLowerCase()
    );
  }
  return rep.toLowerCase() === question.reponseAttendue.trim().toLowerCase();
}

/* ── Correction d'une question avec étapes accordéon ── */
function QuestionCorrection({
  question,
  numero,
  correction,
  reponseEleve,
}: {
  question: QuestionEpreuve;
  numero: number;
  correction?: CorrectionQuestion;
  reponseEleve?: string;
}) {
  // Ancien feedback sans étapes → réévaluer localement (l'IA pouvait se tromper sur les QCM)
  const bonne = correction?.etapes !== undefined
    ? correction.bonne
    : evaluerBonneReponse(question, reponseEleve);

  const pointsObtenus = bonne ? question.pointsQuestion : (correction?.pointsObtenus ?? 0);

  // Résoudre le texte de la bonne réponse pour l'affichage
  const texteReponseAttendue = (() => {
    if (question.type === "QCM" && question.choix) {
      const opt = question.choix.find(
        (c) => c.lettre.toUpperCase() === question.reponseAttendue.trim().toUpperCase()
      );
      return opt ? `${opt.lettre} — ${opt.texte}` : question.reponseAttendue;
    }
    return question.reponseAttendue;
  })();

  const criteresTexte = (Array.isArray(question.criteresCorrection) ? question.criteresCorrection.join(" ") : "") || `La bonne réponse est : ${texteReponseAttendue}`;

  // Méthode, compétence, astuce — depuis l'IA, avec fallback concret si absent
  const methodeOfficielle = correction?.methodeOfficielle
    ?? "Lis attentivement la question, encercle les données importantes, applique la méthode vue en classe étape par étape, puis vérifie que ta réponse répond bien à ce qui était demandé.";
  const competencePFEQ = correction?.competencePFEQ ?? criteresTexte;
  const astuceMemoire = correction?.astuceMemoire
    ?? "Fais un aide-mémoire avec les règles clés de cette notion. Relis-le avant le prochain cours et refais un exercice similaire pour vérifier que tu as bien compris.";

  // Toujours générer des étapes — même pour les bonnes réponses (renforcer la compréhension)
  const etapes: EtapeCorrection[] = correction?.etapes?.length
    ? correction.etapes
    : ([
        {
          titre: "Comprendre la tâche",
          explication: bonne
            ? `On te demandait : ${question.enonce} — Tu as bien répondu ! Voici ce qui était attendu : ${texteReponseAttendue}.`
            : `On te demandait : ${question.enonce} — La réponse attendue était : ${texteReponseAttendue}. Voyons ensemble comment y arriver.`,
          conseil: "Repère les mots-clés dans la question (les nombres, les verbes d'action, ce qu'on te demande de trouver) avant de répondre.",
        },
        {
          titre: "Mobiliser ses connaissances",
          explication: "Voici la règle ou la notion à maîtriser pour répondre à ce type de question :",
          rappelTheorique: criteresTexte,
        },
        {
          titre: "Démarche de résolution pas à pas",
          explication: bonne
            ? "Tu as trouvé la bonne réponse ! Voici la démarche complète pour être sûr(e) de comprendre :"
            : "Voici comment raisonner pour arriver à la bonne réponse :",
          solution: texteReponseAttendue,
          erreurEleve: !bonne && reponseEleve
            ? `Ta réponse : "${reponseEleve}". La réponse attendue : "${texteReponseAttendue}". Vérifie chaque étape de ton raisonnement pour trouver où ça a déraillé.`
            : undefined,
        },
        {
          titre: "Vérification",
          explication: bonne
            ? "Pour t'assurer que ta réponse est correcte : relis la question et vérifie que ta réponse y répond exactement. Si c'est un calcul, refais-le à l'envers pour confirmer."
            : "Pour vérifier une réponse de ce type : relis la question, remplace ta réponse dans l'énoncé et demande-toi si ça a du sens. Si c'est un calcul, refais-le différemment et compare.",
        },
      ] as EtapeCorrection[]);

  // Incorrecte → 1re étape ouverte automatiquement ; correcte → accordéon fermé (consulter si voulu)
  const [etapeOuverte, setEtapeOuverte] = useState<number | null>(
    !bonne ? 0 : null
  );

  return (
    <div className="rounded-2xl border border-[var(--color-rule)] overflow-hidden">
      {/* En-tête question */}
      <div className={`px-5 py-4 ${bonne ? "bg-[rgba(42,124,111,0.04)]" : "bg-[rgba(217,79,43,0.03)]"}`}>
        <div className="flex items-start gap-3">
          {/* Indicateur ✓/✗ */}
          <div className={`flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${
            bonne ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"
          }`}>
            {bonne ? "✓" : "✗"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Numéro + points */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[var(--color-ink-soft)]">Question {numero}</span>
              <span className="text-[var(--color-rule)]">·</span>
              <span className={`text-xs font-bold ${bonne ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                {pointsObtenus}/{question.pointsQuestion} pt{question.pointsQuestion > 1 ? "s" : ""}
              </span>
            </div>
            {/* Énoncé */}
            <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">{question.enonce}</p>
          </div>
        </div>

        {/* Réponse de l'élève — toujours affichée */}
        <div className="mt-3 ml-9 rounded-lg bg-white border border-[var(--color-rule)] px-3 py-2">
          <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-0.5">Ta réponse</p>
          {reponseEleve
            ? <p className="text-sm text-[var(--color-ink)] italic">{reponseEleve}</p>
            : <p className="text-sm text-[var(--color-ink-soft)] italic">Aucune réponse donnée</p>
          }
        </div>

        {/* Résumé explication */}
        {correction?.explication && (
          <div className={`mt-3 ml-9 rounded-xl px-3 py-2 text-sm leading-relaxed ${
            bonne
              ? "bg-[rgba(42,124,111,0.08)] text-[var(--color-ink)]"
              : "bg-[rgba(217,79,43,0.06)] text-[var(--color-ink)]"
          }`}>
            {correction.explication}
          </div>
        )}
      </div>

      {/* Invitation à consulter l'explication pour les bonnes réponses */}
      {bonne && etapes.length > 0 && etapeOuverte === null && (
        <div className="border-t border-[var(--color-rule)] px-5 py-3 bg-[rgba(42,124,111,0.03)]">
          <button
            onClick={() => setEtapeOuverte(0)}
            className="text-xs font-semibold text-[var(--color-success)] hover:underline"
          >
            📖 Comprendre pourquoi cette réponse est correcte →
          </button>
        </div>
      )}

      {/* Étapes d'explication (toutes les questions) */}
      {etapes.length > 0 && etapeOuverte !== null && (
        <div className="border-t border-[var(--color-rule)] divide-y divide-[var(--color-rule)]">
          {bonne && (
            <div className="px-5 py-2.5 bg-[rgba(42,124,111,0.04)] flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--color-success)]">📖 Explication — comprendre pourquoi</p>
              <button onClick={() => setEtapeOuverte(null)} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                Fermer ▲
              </button>
            </div>
          )}
          {etapes.map((etape, idx) => (
            <div key={idx}>
              <button
                onClick={() => setEtapeOuverte(etapeOuverte === idx ? null : idx)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[var(--color-paper-warm)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-black">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{etape.titre}</span>
                </div>
                <span className="text-[var(--color-ink-soft)] text-xs ml-2 flex-shrink-0">
                  {etapeOuverte === idx ? "▲" : "▼"}
                </span>
              </button>

              {etapeOuverte === idx && (
                <div className="px-5 pb-5 pt-3 bg-[var(--color-paper-warm)] space-y-3 animate-fade-in">

                  {/* Explication principale */}
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{etape.explication}</p>

                  {/* Conseil de lecture */}
                  {etape.conseil && (
                    <div className="rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.2)] px-4 py-3">
                      <p className="text-xs font-bold text-[var(--color-purple)] mb-1">💡 Conseil</p>
                      <p className="text-sm text-[var(--color-ink)]">{etape.conseil}</p>
                    </div>
                  )}

                  {/* Solution complète */}
                  {etape.solution && (
                    <div className="rounded-xl bg-white border border-[var(--color-rule)] px-4 py-3">
                      <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">✍️ La bonne réponse</p>
                      <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">{etape.solution}</p>
                    </div>
                  )}

                  {/* Ce que l'élève a fait différemment */}
                  {etape.erreurEleve && (
                    <div className="rounded-xl bg-[rgba(217,79,43,0.04)] border border-[rgba(217,79,43,0.15)] px-4 py-3">
                      <p className="text-xs font-bold text-[var(--color-accent)] mb-1">🔍 Dans ta réponse</p>
                      <p className="text-sm text-[var(--color-ink)]">{etape.erreurEleve}</p>
                    </div>
                  )}

                  {/* À retenir */}
                  {etape.rappelTheorique && (
                    <div className="rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] px-4 py-3">
                      <p className="text-xs font-bold text-[var(--color-success)] mb-1">📚 À retenir</p>
                      <p className="text-sm text-[var(--color-ink)] font-medium">{etape.rappelTheorique}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Méthode officielle */}
          {methodeOfficielle && (
            <div className="px-5 py-4 bg-[rgba(91,79,207,0.04)]">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🏫</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">
                    Méthode officielle — Écoles québécoises
                  </p>
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{methodeOfficielle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compétence PFEQ */}
          {competencePFEQ && (
            <div className="px-5 py-4 bg-[rgba(42,124,111,0.04)]">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🎯</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-1">
                    Compétence PFEQ développée
                  </p>
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{competencePFEQ}</p>
                </div>
              </div>
            </div>
          )}

          {/* Astuce personnalisée */}
          {astuceMemoire && (
            <div className="px-5 py-4 bg-[rgba(201,149,42,0.04)]">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🧠</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-1">
                    Astuce pour retenir (personnalisée pour toi)
                  </p>
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{astuceMemoire}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

/* ── Bloc question (mode épreuve en cours) ── */
function QuestionBlock({
  question, numero, valeur, onChange,
}: {
  question: QuestionEpreuve;
  numero: number;
  valeur: string;
  onChange: (val: string) => void;
}) {
  const ptLabel = `${question.pointsQuestion} pt${question.pointsQuestion > 1 ? "s" : ""}`;

  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2 flex-1">
          <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-bold">
            {numero}
          </span>
          <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">{question.enonce}</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-xs font-bold text-[var(--color-ink-soft)]">
          {ptLabel}
        </span>
      </div>

      {question.type === "QCM" && question.choix && (
        <div className="ml-8 space-y-3">
          {/* Options de référence — cliquer pré-remplit la zone de réponse */}
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
            Choix de réponse (clique pour sélectionner) :
          </p>
          <div className="space-y-1.5">
            {question.choix.map((c) => {
              const selectionne = valeur.trim().toUpperCase() === c.lettre.toUpperCase()
                || valeur.trim().toLowerCase() === c.texte.toLowerCase();
              return (
                <button
                  key={c.lettre}
                  onClick={() => onChange(c.texte)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                    selectionne
                      ? "border-[var(--color-accent)] bg-[rgba(217,79,43,0.05)]"
                      : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <span className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold mt-0.5 ${
                    selectionne
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-rule)] text-[var(--color-ink-soft)]"
                  }`}>{c.lettre}</span>
                  <span className="text-[var(--color-ink)]">{c.texte}</span>
                </button>
              );
            })}
          </div>

          {/* Zone de réponse libre */}
          <div className="pt-1">
            <label className="text-xs font-bold text-[var(--color-ink-soft)] mb-1 block">
              ✍️ Écris ta réponse ici :
            </label>
            <input
              type="text"
              value={valeur}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Tape la lettre (A, B, C...) ou la réponse complète"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
            />
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              💡 Tu peux écrire la lettre ou la réponse en mots — les deux sont acceptés.
            </p>
          </div>
        </div>
      )}

      {question.type === "REPONSE_COURTE" && (
        <input
          type="text"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ta réponse..."
          className="ml-8 w-[calc(100%-2rem)] rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
      )}

      {(question.type === "DEVELOPPEMENT" || question.type === "PROBLEME") && (
        <div className="ml-8">
          <textarea
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.type === "PROBLEME"
              ? "Montre ta démarche étape par étape..."
              : "Développe ta réponse ici..."}
            rows={5}
            className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] resize-none"
          />
          {question.type === "PROBLEME" && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              💡 Montre toutes les étapes de ta démarche — des points sont accordés pour chaque étape.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Matiere } from "@/generated/prisma";
import {
  CURRICULUM_PFEQ,
  getNotionsPourNiveau,
  type SequencePFEQ,
  type NotionPFEQ,
} from "@/lib/pfeq/notions";

/* ── Constantes ── */
const MATIERES: { value: Matiere; emoji: string; label: string; couleur: string }[] = [
  { value: "MATHEMATIQUES", emoji: "🔢", label: "Mathématiques", couleur: "var(--color-purple)" },
  { value: "FRANCAIS", emoji: "✏️", label: "Français", couleur: "var(--color-accent)" },
  { value: "SCIENCES", emoji: "🔬", label: "Sciences", couleur: "var(--color-success)" },
  { value: "UNIVERS_SOCIAL", emoji: "🌍", label: "Univers social", couleur: "var(--color-gold)" },
  { value: "ANGLAIS", emoji: "🗣️", label: "Anglais", couleur: "var(--color-ink)" },
];


const DUREES = [
  { value: 20, label: "20 min", desc: "Mini-épreuve" },
  { value: 45, label: "45 min", desc: "Épreuve standard" },
  { value: 60, label: "60 min", desc: "Épreuve complète" },
  { value: 90, label: "90 min", desc: "Épreuve longue" },
];

const DIFFICULTES = [
  {
    value: "BASE" as const,
    label: "Facile",
    desc: "Pour réviser et consolider les bases. Questions accessibles, bon pour reprendre confiance.",
    emoji: "🌱",
    color: "var(--color-success)",
    bg: "rgba(42,124,111,0.06)",
    border: "var(--color-success)",
  },
  {
    value: "ATTENDU" as const,
    label: "Intermédiaire",
    desc: "Le niveau attendu pour ton année. Un bon défi sans être dépassé.",
    emoji: "🎯",
    color: "var(--color-gold)",
    bg: "rgba(196,148,31,0.06)",
    border: "var(--color-gold)",
  },
  {
    value: "AVANCE" as const,
    label: "Difficile",
    desc: "Pour te dépasser et viser l'excellence. Questions plus complexes et exigeantes.",
    emoji: "🔥",
    color: "var(--color-accent)",
    bg: "rgba(217,79,43,0.06)",
    border: "var(--color-accent)",
  },
] as const;

type DifficulteVal = "BASE" | "ATTENDU" | "AVANCE";

/* ── Types ── */
type Mode = "simple" | "epreuve";
type Etape = "matiere" | "mode" | "notions" | "difficulte" | "duree" | "generation";

interface PlanNotion extends NotionPFEQ { priorite: string }

const PRIORITE_PLAN_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  URGENT:    { label: "Urgent",    bg: "bg-red-50 border-red-200 text-red-700",       dot: "bg-red-500" },
  IMPORTANT: { label: "Important", bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400" },
  PLUS_TARD: { label: "Plus tard", bg: "bg-blue-50 border-blue-200 text-blue-700",    dot: "bg-blue-400" },
};

/* ── Composant principal ── */
export default function NouvelExercicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [etape, setEtape] = useState<Etape>("matiere");
  const [matiere, setMatiere] = useState<Matiere | null>(null);
  const [mode, setMode] = useState<Mode>("simple");
  const [notionsChoisies, setNotionsChoisies] = useState<NotionPFEQ[]>([]);
  const [duree, setDuree] = useState(45);
  const [difficulte, setDifficulte] = useState<DifficulteVal>("ATTENDU");
  const [planInit, setPlanInit] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [planNotions, setPlanNotions] = useState<PlanNotion[]>([]);

  // Fetch profil to get niveauScolaire
  const { data: profilData } = trpc.eleve.getProfil.useQuery();
  const niveau = profilData?.niveauScolaire ?? "PRIMAIRE_6";

  // Fetch notion active du plan (une seule, la première non maîtrisée)
  const isPlanParam = searchParams.get("plan") === "1";
  const { data: notionActive } = trpc.plan.getNotionActive.useQuery(undefined, {
    enabled: isPlanParam,
  });

  // Initialisation mode plan — notion unique, verrouillée
  useEffect(() => {
    if (planInit || !profilData) return;
    if (!isPlanParam) { setPlanInit(true); return; }
    if (notionActive === undefined) return; // attendre

    if (!notionActive) {
      // Plus de notion à travailler → mode libre
      setPlanInit(true);
      return;
    }

    // Résoudre la notion active vers son objet PFEQ
    const seqs = getNotionsPourNiveau(notionActive.matiere as Matiere, profilData.niveauScolaire ?? "PRIMAIRE_6");
    const allNotions = seqs.flatMap((s) => s.notions);
    const notionPFEQ = allNotions.find((n) => n.id === notionActive.notion);

    if (!notionPFEQ) {
      // ID non trouvé dans le PFEQ → mode libre
      setPlanInit(true);
      return;
    }

    const planNotion: PlanNotion = { ...notionPFEQ, priorite: notionActive.priorite as string };

    setPlanMode(true);
    setMatiere(notionActive.matiere as Matiere);
    setPlanNotions([planNotion]);
    setNotionsChoisies([notionPFEQ]); // verrouillée — une seule notion

    // Sauter directement à la difficulté — pas d'étape de sélection
    setEtape("difficulte");
    setPlanInit(true);
  }, [profilData, notionActive, planInit, isPlanParam]);

  const generer = trpc.exercice.generer.useMutation({
    onSuccess: (data) => { jouerSonNotification(); router.push(`/eleve/exercices/${data.id}`); },
  });

  const genererEpreuve = trpc.exercice.genererEpreuve.useMutation({
    onSuccess: (data) => { jouerSonNotification(); router.push(`/eleve/exercices/epreuve/${data.id}`); },
  });

  const sequences: SequencePFEQ[] = useMemo(() => {
    if (!matiere) return [];
    return getNotionsPourNiveau(matiere, niveau);
  }, [matiere, niveau]);

  const hasCurriculum = matiere ? !!CURRICULUM_PFEQ[matiere] : false;

  const toggleNotion = (notion: NotionPFEQ) => {
    setNotionsChoisies((prev) =>
      prev.find((n) => n.id === notion.id)
        ? prev.filter((n) => n.id !== notion.id)
        : [...prev, notion]
    );
  };

  const handleGenerer = () => {
    if (!matiere) return;
    setEtape("generation");

    const notionsPayload = notionsChoisies.map((n) => ({
      label: n.label,
      description: n.description,
    }));

    if (mode === "epreuve") {
      genererEpreuve.mutate({ matiere, notions: notionsPayload, dureeMinutes: duree, difficulteChoisie: difficulte });
    } else {
      generer.mutate({
        matiere,
        // En mode plan, on force toujours les notions ; en mode libre, optionnel
        notions: (planMode || notionsPayload.length > 0) ? notionsPayload : undefined,
        difficulteChoisie: difficulte,
      });
    }
  };

  const isError = generer.isError || genererEpreuve.isError;

  /* ─── LOADER plan mode (en attente des données) ─── */
  if (isPlanParam && !planInit) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce">🗺️</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Chargement de ton plan…</p>
        </div>
      </div>
    );
  }

  /* ─── ÉTAPE : GÉNÉRATION ─── */
  if (etape === "generation") {
    return (
      <div className="min-h-screen bg-[var(--color-paper)]">
        <div className="mx-auto max-w-lg px-4 py-10">
          <GenerationEnCours mode={mode} duree={duree} />
          {isError && (
            <div className="mt-6 text-center">
              {(() => {
                const raw = generer.error?.message ?? genererEpreuve.error?.message ?? "";
                const isBilling = raw.includes("credit balance") || raw.includes("billing") || raw.includes("402");
                const isRateLimit = raw.includes("rate") || raw.includes("429") || raw.includes("limite");
                return isBilling ? (
                  <>
                    <p className="text-sm font-semibold text-[var(--color-accent)] mb-1">Service temporairement indisponible</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mb-3 max-w-xs mx-auto">
                      L'IA est momentanément inaccessible. Réessaie dans quelques minutes ou contacte un administrateur.
                    </p>
                  </>
                ) : isRateLimit ? (
                  <>
                    <p className="text-sm font-semibold text-[var(--color-accent)] mb-1">Trop de demandes</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mb-3 max-w-xs mx-auto">
                      Tu as atteint la limite d'utilisation. Attends quelques minutes et réessaie.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[var(--color-accent)] mb-1">Une erreur s'est produite</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mb-3 max-w-xs mx-auto">
                      La génération a échoué. Réessaie ou contacte le support si le problème persiste.
                    </p>
                  </>
                );
              })()}
              <Button variant="secondary" onClick={() => { setEtape(mode === "epreuve" ? "duree" : "difficulte"); generer.reset(); genererEpreuve.reset(); }}>
                ← Retour
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href={planMode ? "/eleve/plan" : "/eleve"} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
          {planMode ? "← Mon plan" : "← Tableau de bord"}
        </Link>

        {/* Barre de progression */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)] mb-1">
            {planMode ? "🗺️ Exercice du plan" : mode === "epreuve" ? "📋 Nouvelle épreuve" : "✨ Nouvel exercice"}
          </h1>
          {planMode && planNotions[0] && (
            <div className="mb-4 rounded-xl border border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.05)] px-4 py-3">
              <p className="text-xs text-[var(--color-purple)] font-bold mb-0.5">Notion du plan 🗺️</p>
              <p className="text-sm font-black text-[var(--color-ink)]">
                {planNotions[0].label}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                L'exercice portera entièrement sur cette notion. Quand tu la maîtrises, tu passes à la suivante.
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            {(planMode
              ? (["notions", "difficulte"] as Etape[])
              : (["matiere", "mode", "notions", "difficulte", ...(mode === "epreuve" ? ["duree"] : [])] as Etape[])
            ).map((e, i, arr) => {
              const labels: Partial<Record<Etape, string>> = {
                matiere: "Matière", mode: "Type", notions: "Notions", difficulte: "Difficulté", duree: "Durée",
              };
              const isActive = etape === e;
              const isPast = arr.indexOf(etape) > i;
              return (
                <div key={e} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isPast ? "bg-[var(--color-success)] text-white"
                    : isActive ? "bg-[var(--color-ink)] text-white scale-110"
                    : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
                  }`}>
                    {isPast ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                    {labels[e]}
                  </span>
                  {i < arr.length - 1 && <div className={`h-0.5 w-6 rounded ${isPast ? "bg-[var(--color-success)]" : "bg-[var(--color-rule)]"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ÉTAPE 1 — Matière */}
        {etape === "matiere" && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-1">Quelle matière ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-5">Choisis la matière sur laquelle tu veux travailler.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-6">
              {MATIERES.map((m) => (
                <button key={m.value} onClick={() => setMatiere(m.value)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    matiere === m.value
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                      : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <div className="text-3xl mb-1">{m.emoji}</div>
                  <div className={`text-xs font-semibold ${matiere === m.value ? "text-white" : "text-[var(--color-ink)]"}`}>{m.label}</div>
                </button>
              ))}
            </div>
            <Button onClick={() => { setNotionsChoisies([]); setEtape("mode"); }} disabled={!matiere} size="lg" className="w-full">
              Continuer →
            </Button>
          </Card>
        )}

        {/* ÉTAPE 2 — Mode : exercice simple ou épreuve complète */}
        {etape === "mode" && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-1">Quel type de travail ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-5">Choisis selon le temps que tu as et ce que tu veux faire.</p>
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
              <button onClick={() => setMode("simple")}
                className={`rounded-xl border-2 p-5 text-left transition-all ${
                  mode === "simple" ? "border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]" : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <div className="text-3xl mb-2">✏️</div>
                <p className="font-bold text-sm text-[var(--color-ink)]">Exercice personnalisé</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">Un exercice ciblé sur une ou plusieurs notions. Idéal pour pratiquer une notion spécifique.</p>
                <p className="text-xs font-semibold text-[var(--color-accent)] mt-2">~10-20 min</p>
              </button>
              <button onClick={() => setMode("epreuve")}
                className={`rounded-xl border-2 p-5 text-left transition-all ${
                  mode === "epreuve" ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.04)]" : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <div className="text-3xl mb-2">📋</div>
                <p className="font-bold text-sm text-[var(--color-ink)]">Épreuve complète</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">Une épreuve structurée comme celles du MEES — mise en situation, 3 parties, barème sur 100 points.</p>
                <p className="text-xs font-semibold text-[var(--color-purple)] mt-2">20 à 90 min · 100 pts</p>
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEtape("matiere")} className="flex-1">← Retour</Button>
              <Button onClick={() => setEtape(hasCurriculum ? "notions" : "generation")} className="flex-[2]">Continuer →</Button>
            </div>
          </Card>
        )}

        {/* ÉTAPE 3 — Choix des notions */}
        {etape === "notions" && (
          planMode ? (
            /* ── Mode Plan : notions verrouillées au plan ── */
            <div className="animate-fade-in space-y-4">
              <Card className="p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🗺️</span>
                  <p className="text-sm font-bold text-[var(--color-purple)]">Exercice du plan</p>
                  <span className="ml-auto rounded-full bg-[rgba(91,79,207,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-purple)]">
                    Plan actif
                  </span>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  Ces notions viennent de ton plan de réussite. Coche celles sur lesquelles tu veux t'entraîner aujourd'hui.
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                  {notionsChoisies.length} / {planNotions.length} notion{planNotions.length > 1 ? "s" : ""} sélectionnée{notionsChoisies.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {planNotions.map((notion) => {
                    const isSelected = notionsChoisies.some((n) => n.id === notion.id);
                    const cfg = PRIORITE_PLAN_CONFIG[notion.priorite] ?? PRIORITE_PLAN_CONFIG.IMPORTANT;
                    return (
                      <button
                        key={notion.id}
                        onClick={() => toggleNotion(notion)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-sm"
                            : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                        }`}
                      >
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-white bg-white" : "border-[var(--color-rule)]"
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--color-ink)]" />}
                        </span>
                        <span className={`flex-1 text-sm font-semibold ${isSelected ? "text-white" : "text-[var(--color-ink)]"}`}>
                          {notion.label}
                        </span>
                        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          isSelected ? "border-white/30 bg-white/10 text-white" : cfg.bg
                        }`}>
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                {notionsChoisies.length === 0 && (
                  <p className="text-xs text-[var(--color-accent)] mb-3">⚠️ Sélectionne au moins une notion.</p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => router.push("/eleve/plan")} className="flex-1">← Mon plan</Button>
                  <Button
                    onClick={() => setEtape("difficulte")}
                    disabled={notionsChoisies.length === 0}
                    className="flex-[2]"
                  >
                    Choisir la difficulté →
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* ── Mode libre : toutes les notions PFEQ ── */
            <div className="animate-fade-in space-y-4">
              <Card className="p-5">
                <h2 className="text-lg font-bold text-[var(--color-ink)] mb-1">
                  Sur quelles notions veux-tu travailler ?
                </h2>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {mode === "epreuve"
                    ? "Choisis une ou plusieurs notions — l'épreuve les couvrira toutes."
                    : "Choisis des notions précises pour un exercice ciblé. Laisse vide pour que l'IA choisisse."}
                </p>
                {notionsChoisies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {notionsChoisies.map((n) => (
                      <span key={n.id}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        {n.label}
                        <button onClick={() => toggleNotion(n)} className="ml-0.5 opacity-70 hover:opacity-100">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {sequences.map((seq) => (
                <Card key={seq.id} className="overflow-hidden">
                  <div className="flex items-center gap-2 bg-[var(--color-paper-warm)] px-5 py-3 border-b border-[var(--color-rule)]">
                    <span className="text-lg">{seq.emoji}</span>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">{seq.label}</h3>
                  </div>
                  <div className="px-5 py-4 flex flex-wrap gap-2">
                    {seq.notions.map((notion) => {
                      const isSelected = notionsChoisies.some((n) => n.id === notion.id);
                      return (
                        <button key={notion.id} onClick={() => toggleNotion(notion)}
                          title={notion.description}
                          className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                            isSelected
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                              : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                          }`}
                        >
                          {isSelected && "✓ "}{notion.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}

              <Card className="p-5">
                {mode === "epreuve" && notionsChoisies.length === 0 && (
                  <p className="text-xs text-[var(--color-accent)] mb-3">⚠️ Choisis au moins une notion pour l'épreuve.</p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setEtape("mode")} className="flex-1">← Retour</Button>
                  <Button
                    onClick={() => setEtape("difficulte")}
                    disabled={mode === "epreuve" && notionsChoisies.length === 0}
                    className="flex-[2]"
                  >
                    Choisir la difficulté →
                  </Button>
                </div>
              </Card>
            </div>
          )
        )}

        {/* ÉTAPE 4 — Niveau de difficulté */}
        {etape === "difficulte" && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-1">Quel niveau de difficulté ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-5">
              Choisis selon comment tu te sens et ce que tu veux travailler.
            </p>
            <div className="space-y-3 mb-6">
              {DIFFICULTES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulte(d.value)}
                  className="w-full rounded-xl border-2 p-4 text-left transition-all"
                  style={{
                    borderColor: difficulte === d.value ? d.border : "var(--color-rule)",
                    background: difficulte === d.value ? d.bg : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{d.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: difficulte === d.value ? d.color : "var(--color-ink)" }}>
                        {d.label}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{d.desc}</p>
                    </div>
                    {difficulte === d.value && (
                      <span className="text-sm font-bold" style={{ color: d.color }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {/* Récap notions choisies */}
            {notionsChoisies.length > 0 && (
              <div className="mb-5 rounded-xl bg-[var(--color-paper-warm)] px-4 py-3">
                <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                  {planMode ? "🗺️ Notions du plan sélectionnées :" : "📚 Notions choisies :"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {notionsChoisies.map((n) => (
                    <span key={n.id} className="rounded-full bg-white border border-[var(--color-rule)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink)]">
                      {n.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEtape("notions")} className="flex-1">← Retour</Button>
              <Button
                onClick={() => mode === "epreuve" ? setEtape("duree") : handleGenerer()}
                className="flex-[2]"
              >
                {mode === "epreuve" ? "Choisir la durée →" : "Générer mon exercice ✨"}
              </Button>
            </div>
          </Card>
        )}

        {/* ÉTAPE 5 (épreuve seulement) — Durée */}
        {etape === "duree" && mode === "epreuve" && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-1">Quelle durée pour ton épreuve ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-5">
              Le nombre de questions et la complexité s'adaptent à la durée choisie.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DUREES.map((d) => (
                <button key={d.value} onClick={() => setDuree(d.value)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    duree === d.value
                      ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]"
                      : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <p className={`text-xl font-black ${duree === d.value ? "text-[var(--color-purple)]" : "text-[var(--color-ink)]"}`}>{d.label}</p>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>

            {/* Récap */}
            <div className="rounded-xl bg-[var(--color-paper-warm)] px-4 py-3 mb-5">
              <p className="text-xs font-bold text-[var(--color-ink)] mb-1">Ton épreuve :</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                📚 {MATIERES.find((m) => m.value === matiere)?.label} ·{" "}
                {DIFFICULTES.find((d) => d.value === difficulte)?.emoji}{" "}
                {DIFFICULTES.find((d) => d.value === difficulte)?.label} ·{" "}
                ⏱ {duree} min · 100 pts
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {notionsChoisies.map((n) => (
                  <span key={n.id} className="rounded-full bg-white border border-[var(--color-rule)] px-2 py-0.5 text-[10px] text-[var(--color-ink)]">
                    {n.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEtape("difficulte")} className="flex-1">← Retour</Button>
              <Button onClick={handleGenerer} className="flex-[2]">
                Générer mon épreuve 📋
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SON DE NOTIFICATION
══════════════════════════════════════════════════════════════ */

function jouerSonNotification() {
  try {
    const ctx = new AudioContext();
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
    // AudioContext non disponible
  }
}

/* ══════════════════════════════════════════════════════════════
   ÉCRAN DE GÉNÉRATION ANIMÉ
══════════════════════════════════════════════════════════════ */

const MESSAGES_EXERCICE = [
  { emoji: "📖", texte: "L'IA consulte le programme PFEQ…" },
  { emoji: "🎯", texte: "Elle choisit les meilleures notions pour toi…" },
  { emoji: "✏️", texte: "Elle adapte les questions à ton niveau…" },
  { emoji: "🌟", texte: "Elle personnalise l'exercice selon ton profil…" },
  { emoji: "🔍", texte: "Elle vérifie que tout est bien calibré…" },
  { emoji: "✨", texte: "Ton exercice est presque prêt…" },
];

const MESSAGES_EPREUVE = [
  { emoji: "📋", texte: "L'IA construit la mise en situation…" },
  { emoji: "✍️", texte: "Elle rédige les questions de la Partie 1…" },
  { emoji: "📐", texte: "Elle prépare la Partie 2 avec des défis…" },
  { emoji: "🏆", texte: "Elle crée la Partie 3 pour te pousser…" },
  { emoji: "⚖️", texte: "Elle calibre le barème sur 100 points…" },
  { emoji: "📚", texte: "Elle aligne tout sur le PFEQ québécois…" },
  { emoji: "🌟", texte: "Ton épreuve complète est presque prête…" },
];

function GenerationEnCours({ mode, duree }: { mode: Mode; duree: number }) {
  const [secondes, setSecondes] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = mode === "epreuve" ? MESSAGES_EPREUVE : MESSAGES_EXERCICE;
  // Épreuve = jusqu'à 2 min, exercice = jusqu'à 1 min
  const MAX_SECONDES = mode === "epreuve" ? 120 : 60;
  const tempsLabel = mode === "epreuve"
    ? `Cette épreuve de ${duree} min peut prendre 1 à 2 minutes à générer`
    : "Cela prend généralement moins d'une minute";

  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIndex((i) => (i + 1) % messages.length),
      3500
    );
    return () => clearInterval(t);
  }, [messages.length]);

  const progression = Math.min(secondes / MAX_SECONDES, 0.97);
  const rayon = 52;
  const circonf = 2 * Math.PI * rayon;
  const dashOffset = circonf * (1 - progression);
  const { emoji, texte } = messages[msgIndex];

  return (
    <div className="flex flex-col items-center justify-center py-14 space-y-7">
      {/* Cercle de progression */}
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={rayon} fill="none" stroke="var(--color-rule)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={rayon}
            fill="none"
            stroke={mode === "epreuve" ? "var(--color-purple)" : "var(--color-accent)"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circonf}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-4xl"
          key={msgIndex}
          style={{ animation: "fadeIn 0.4s ease" }}
        >
          {emoji}
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xl font-black text-[var(--color-ink)]">
          {mode === "epreuve" ? "Génération de l'épreuve…" : "Génération de l'exercice…"}
        </p>
        <p
          className="text-sm text-[var(--color-ink-soft)] min-h-[1.25rem]"
          key={msgIndex}
          style={{ animation: "fadeIn 0.4s ease" }}
        >
          {texte}
        </p>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
          ⏱ {tempsLabel}
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

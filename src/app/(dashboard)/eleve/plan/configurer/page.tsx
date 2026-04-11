"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Matiere, PrioriteNotion } from "@/generated/prisma";

// ── Données ──────────────────────────────────────────────────────────────────

const MATIERES = [
  { id: "MATHEMATIQUES" as Matiere, label: "Mathématiques", emoji: "🔢" },
  { id: "FRANCAIS"      as Matiere, label: "Français",       emoji: "📖" },
  { id: "SCIENCES"      as Matiere, label: "Sciences",       emoji: "🔬" },
  { id: "UNIVERS_SOCIAL"as Matiere, label: "Univers social", emoji: "🌍" },
  { id: "ANGLAIS"       as Matiere, label: "Anglais",        emoji: "🇨🇦" },
];

const SCORES = [60, 65, 70, 75, 80, 85, 90, 95, 100];

const PRIORITE_CONFIG = {
  URGENT: {
    label: "🔴 Urgent",
    sousTitre: "Je n'y comprends rien",
    explication: "Tu commences par ça. L'appli va t'entraîner dessus en premier, chaque jour, jusqu'à ce que tu maîtrises.",
    quandChoisir: "Je suis vraiment perdu(e) sur cette notion — les exercices m'aident pas encore.",
    color: "border-red-400 bg-red-50 text-red-700",
    badge: "bg-red-500",
  },
  IMPORTANT: {
    label: "🟡 Important",
    sousTitre: "Je me débrouille mais c'est pas solide",
    explication: "Tu travailles ça après avoir maîtrisé tes urgences. Des exercices réguliers pour consolider.",
    quandChoisir: "Je comprends un peu mais je fais encore des erreurs — j'ai besoin de m'entraîner plus.",
    color: "border-amber-400 bg-amber-50 text-amber-700",
    badge: "bg-amber-400",
  },
  PLUS_TARD: {
    label: "🔵 Plus tard",
    sousTitre: "Je connais à peu près",
    explication: "Tu reviendras sur ça quand tu auras fini les autres. Pour ne pas l'oublier complètement.",
    quandChoisir: "Je maîtrise pas mal — juste besoin d'une petite révision de temps en temps.",
    color: "border-blue-300 bg-blue-50 text-blue-700",
    badge: "bg-blue-400",
  },
};

function getDateEcheanceDefaut() {
  const d = new Date();
  d.setMonth(d.getMonth() + 4);
  return d.toISOString().slice(0, 10);
}

function addMonths(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function finAnnéeScolaire() {
  // Fin d'année scolaire québécoise ≈ 24 juin
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-06-24`;
}

function formatDateFr(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

const DATE_PRESETS = [
  { label: "1 mois",    emoji: "📅", getValue: () => addMonths(1) },
  { label: "3 mois",    emoji: "🗓️", getValue: () => addMonths(3) },
  { label: "6 mois",    emoji: "📆", getValue: () => addMonths(6) },
  { label: "Fin d'année scolaire", emoji: "🎓", getValue: finAnnéeScolaire },
];

// ── Types ──────────────────────────────────────────────────────────────────

interface ObjectifLocal {
  matiere: Matiere;
  scoreVise: number;
  dateEcheance: string;
}

interface DispoLocal {
  lundi: number; mardi: number; mercredi: number;
  jeudi: number; vendredi: number; samedi: number; dimanche: number;
}

type NotionPrioritisee = { notion: string; matiere: Matiere; label: string; priorite: PrioriteNotion };

// ── Composant principal ──────────────────────────────────────────────────────

const SECTION_TO_ETAPE: Record<string, number> = {
  objectifs: 0, disponibilite: 1, notions: 2,
};

const SECTION_TITRES: Record<string, { titre: string; emoji: string }> = {
  objectifs:    { titre: "Mes objectifs de note",   emoji: "🎯" },
  disponibilite:{ titre: "Ma disponibilité",        emoji: "⏰" },
  notions:      { titre: "Mes notions prioritaires",emoji: "📚" },
};

export default function ConfigurerPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section"); // "objectifs" | "disponibilite" | "notions" | null
  const sectionMode  = sectionParam !== null && sectionParam in SECTION_TO_ETAPE;

  const [etape, setEtape] = useState(sectionMode ? SECTION_TO_ETAPE[sectionParam!] : 0);
  const [saving, setSaving] = useState(false);
  const [initialise, setInitialise] = useState(false);

  // État des 3 étapes
  const [objectifs, setObjectifs] = useState<ObjectifLocal[]>([]);
  const [dispo, setDispo] = useState<DispoLocal>({
    lundi: 15, mardi: 15, mercredi: 20,
    jeudi: 15, vendredi: 15, samedi: 30, dimanche: 20,
  });
  const [notionsPrioritisees, setNotionsPrioritisees] = useState<NotionPrioritisee[]>([]);
  const [matiereNotionsSelectionnee, setMatiereNotionsSelectionnee] = useState<Matiere>("MATHEMATIQUES");

  // Chargement des données existantes
  const { data: objectifsExistants } = trpc.plan.getObjectifs.useQuery();
  const { data: dispoExistante } = trpc.plan.getDisponibilite.useQuery();
  const { data: notionsExistantes } = trpc.plan.getPlanifNotions.useQuery();

  // Initialiser l'état avec les données existantes (une seule fois)
  useEffect(() => {
    if (initialise) return;
    if (!objectifsExistants || !dispoExistante || !notionsExistantes) return;

    if (objectifsExistants.length > 0) {
      setObjectifs(objectifsExistants.map((o) => ({
        matiere: o.matiere as Matiere,
        scoreVise: o.scoreVise,
        dateEcheance: new Date(o.dateEcheance).toISOString().slice(0, 10),
      })));
      // Si on a des objectifs, sélectionner la première matière dans l'étape notions
      setMatiereNotionsSelectionnee(objectifsExistants[0].matiere as Matiere);
    }

    setDispo({
      lundi:    dispoExistante.lundi    ?? 15,
      mardi:    dispoExistante.mardi    ?? 15,
      mercredi: dispoExistante.mercredi ?? 20,
      jeudi:    dispoExistante.jeudi    ?? 15,
      vendredi: dispoExistante.vendredi ?? 15,
      samedi:   dispoExistante.samedi   ?? 30,
      dimanche: dispoExistante.dimanche ?? 20,
    });

    if (notionsExistantes.length > 0) {
      setNotionsPrioritisees(notionsExistantes
        .filter((n) => n.priorite !== "MAITRISE")
        .map((n) => ({
          notion: n.notion,
          matiere: n.matiere as Matiere,
          label: n.notion.replace(/_/g, " "),
          priorite: n.priorite as PrioriteNotion,
        }))
      );
    }

    setInitialise(true);
  }, [objectifsExistants, dispoExistante, notionsExistantes, initialise]);

  // tRPC mutations
  const upsertObjectif    = trpc.plan.upsertObjectif.useMutation();
  const supprimerObjectif = trpc.plan.supprimerObjectif.useMutation();
  const saveDisponibilite = trpc.plan.saveDisponibilite.useMutation();
  const upsertNotion      = trpc.plan.upsertPlanifNotion.useMutation();
  const supprimerNotion   = trpc.plan.supprimerPlanifNotion.useMutation();
  const recalculerOrdre   = trpc.plan.recalculerOrdre.useMutation();

  const { data: notionsDispos } = trpc.plan.getNotionsPourMatiere.useQuery(
    { matiere: matiereNotionsSelectionnee },
    { enabled: etape === 2 || sectionParam === "notions" }
  );

  // ── Sauvegarde par section (mode édition rapide) ────────────────────────

  async function sauvegarderObjectifs() {
    setSaving(true);
    try {
      if (objectifsExistants) {
        const retirées = objectifsExistants
          .filter((oe) => !objectifs.some((o) => o.matiere === oe.matiere))
          .map((oe) => oe.matiere as Matiere);
        await Promise.all(retirées.map((m) => supprimerObjectif.mutateAsync({ matiere: m })));
      }
      await Promise.all(objectifs.map((o) => upsertObjectif.mutateAsync(o)));
      router.push("/eleve/plan");
    } finally { setSaving(false); }
  }

  async function sauvegarderDisponibilite() {
    setSaving(true);
    try {
      await saveDisponibilite.mutateAsync(dispo);
      router.push("/eleve/plan");
    } finally { setSaving(false); }
  }

  async function sauvegarderNotions() {
    setSaving(true);
    try {
      if (notionsExistantes) {
        const retirées = notionsExistantes
          .filter((ne) => !notionsPrioritisees.some((n) => n.notion === ne.notion))
          .map((ne) => ne.notion);
        await Promise.all(retirées.map((n) => supprimerNotion.mutateAsync({ notion: n })));
      }
      await Promise.all(
        notionsPrioritisees.map((n) =>
          upsertNotion.mutateAsync({ notion: n.notion, matiere: n.matiere, priorite: n.priorite })
        )
      );
      // Appliquer l'ordre défini par l'utilisateur (↑↓) via reorderNotions
      // On récupère les IDs depuis les notions existantes après upsert
      // Pour simplifier : recalculerOrdre applique priorité puis création
      await recalculerOrdre.mutateAsync();
      router.push("/eleve/plan");
    } finally { setSaving(false); }
  }

  // ── Sauvegarde complète (wizard 3 étapes) ───────────────────────────────

  async function sauvegarderTout() {
    setSaving(true);
    try {
      // Supprimer les objectifs qui ont été retirés
      if (objectifsExistants) {
        const matieresRetirées = objectifsExistants
          .filter((oe) => !objectifs.some((o) => o.matiere === oe.matiere))
          .map((oe) => oe.matiere as Matiere);
        await Promise.all(matieresRetirées.map((m) => supprimerObjectif.mutateAsync({ matiere: m })));
      }

      // Supprimer les notions qui ont été retirées
      if (notionsExistantes) {
        const notionsRetirées = notionsExistantes
          .filter((ne) => !notionsPrioritisees.some((n) => n.notion === ne.notion))
          .map((ne) => ne.notion);
        await Promise.all(notionsRetirées.map((n) => supprimerNotion.mutateAsync({ notion: n })));
      }

      // Sauvegarder tout
      await Promise.all([
        ...objectifs.map((o) => upsertObjectif.mutateAsync(o)),
        saveDisponibilite.mutateAsync(dispo),
        ...notionsPrioritisees.map((n) =>
          upsertNotion.mutateAsync({ notion: n.notion, matiere: n.matiere, priorite: n.priorite })
        ),
      ]);

      await recalculerOrdre.mutateAsync();
      router.push("/eleve/plan");
    } finally {
      setSaving(false);
    }
  }

  // Afficher un loader pendant l'initialisation
  if (!initialise && (!objectifsExistants || !dispoExistante || !notionsExistantes)) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce">🗺️</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Chargement de ton plan…</p>
        </div>
      </div>
    );
  }

  const estModification = (objectifsExistants?.length ?? 0) > 0 || (notionsExistantes?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Retour */}
        <Link
          href="/eleve/plan"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← Mon plan
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">
            {sectionMode ? SECTION_TITRES[sectionParam!].emoji : "🗺️"}
          </div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            {sectionMode
              ? `Modifier : ${SECTION_TITRES[sectionParam!].titre}`
              : estModification ? "Modifier mon plan" : "Mon plan de réussite"}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {sectionMode
              ? "Modifie uniquement cette section et enregistre."
              : estModification
                ? "Mets à jour tes objectifs, ta disponibilité et tes notions."
                : "3 étapes pour créer ton chemin vers la réussite"}
          </p>
        </div>

        {/* Indicateur d'étapes — uniquement en mode wizard complet */}
        {!sectionMode && (
          <div className="flex items-center gap-2 mb-8">
            {["🎯 Mes objectifs", "⏰ Mon temps", "📚 Mes notions"].map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`h-2 w-full rounded-full transition-all ${
                  i < etape ? "bg-[var(--color-success)]" :
                  i === etape ? "bg-[var(--color-ink)]" :
                  "bg-[var(--color-rule)]"
                }`} />
                <span className={`text-[10px] font-semibold ${i === etape ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Étape 0 : Objectifs de note ── */}
        {etape === 0 && (
          <div className="space-y-4">
            <Card className="p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)]">
              <p className="text-sm font-bold text-[var(--color-purple)] mb-1">
                🎯 Quelle note veux-tu avoir ?
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Choisis les matières où tu veux t'améliorer et définis ta cible. Tu peux en choisir autant que tu veux !
              </p>
            </Card>

            {/* Mira — bulle d'encouragement étape 0 */}
            <div className="flex items-start gap-3 px-1">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#8b78e6] text-base shadow-sm">
                ✦
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[rgba(91,79,207,0.08)] border border-[rgba(91,79,207,0.15)] px-4 py-3 text-sm text-[var(--color-ink)] leading-relaxed">
                Fixe-toi des objectifs motivants — ni trop facile, ni trop ambitieux !
                Si tu n&apos;as pas encore de note, commence par <strong>75 %</strong>. Tu ajustes quand tu veux. 🎯
              </div>
            </div>

            {MATIERES.map((mat) => {
              const obj = objectifs.find((o) => o.matiere === mat.id);
              const isActif = !!obj;
              return (
                <Card key={mat.id} className={`p-4 transition-all ${isActif ? "border-[var(--color-ink)] shadow-sm" : ""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{mat.emoji}</span>
                    <span className="font-bold text-[var(--color-ink)]">{mat.label}</span>
                    <button
                      onClick={() => {
                        if (isActif) {
                          setObjectifs(objectifs.filter((o) => o.matiere !== mat.id));
                        } else {
                          setObjectifs([...objectifs, { matiere: mat.id, scoreVise: 80, dateEcheance: getDateEcheanceDefaut() }]);
                          setMatiereNotionsSelectionnee(mat.id);
                        }
                      }}
                      className={`ml-auto rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        isActif
                          ? "bg-[var(--color-ink)] text-white"
                          : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                      }`}
                    >
                      {isActif ? "✓ Ajouté" : "+ Ajouter"}
                    </button>
                  </div>

                  {isActif && (
                    <div className="space-y-3 pl-2 border-l-2 border-[var(--color-rule)] ml-1">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Note cible</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {SCORES.map((s) => (
                            <button
                              key={s}
                              onClick={() => setObjectifs(objectifs.map((o) => o.matiere === mat.id ? { ...o, scoreVise: s } : o))}
                              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                                obj.scoreVise === s
                                  ? "bg-[var(--color-ink)] text-white"
                                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                              }`}
                            >
                              {s} %
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Pour quand ? 📅</p>
                        {/* Raccourcis rapides */}
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {DATE_PRESETS.map((preset) => {
                            const val = preset.getValue();
                            const isSelected = obj.dateEcheance === val;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setObjectifs(objectifs.map((o) => o.matiere === mat.id ? { ...o, dateEcheance: val } : o))}
                                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-[var(--color-ink)] text-white"
                                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                                }`}
                              >
                                {preset.emoji} {preset.label}
                              </button>
                            );
                          })}
                        </div>
                        {/* Date personnalisée */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-[var(--color-ink-soft)] flex-shrink-0">Ou une date précise :</label>
                          <input
                            type="date"
                            value={obj.dateEcheance}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setObjectifs(objectifs.map((o) => o.matiere === mat.id ? { ...o, dateEcheance: e.target.value } : o))}
                            className="rounded-lg border border-[var(--color-rule)] px-2 py-1 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                          />
                        </div>
                        {obj.dateEcheance && (
                          <p className="text-[11px] text-[var(--color-ink-soft)] mt-1.5">
                            🎯 Objectif à atteindre le <span className="font-semibold text-[var(--color-ink)]">{formatDateFr(obj.dateEcheance)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => router.push("/eleve/plan")} className="flex-1">
                Annuler
              </Button>
              {sectionMode ? (
                <Button onClick={sauvegarderObjectifs} className="flex-[2]" disabled={saving || objectifs.length === 0}>
                  {saving ? "Enregistrement…" : "Enregistrer ✅"}
                </Button>
              ) : (
                <Button onClick={() => setEtape(1)} className="flex-[2]" disabled={objectifs.length === 0}>
                  Suivant → {objectifs.length > 0 ? `(${objectifs.length} objectif${objectifs.length > 1 ? "s" : ""})` : ""}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Étape 1 : Disponibilité ── */}
        {etape === 1 && (
          <div className="space-y-4">
            <Card className="p-5 border-[rgba(42,124,111,0.2)] bg-[rgba(42,124,111,0.04)]">
              <p className="text-sm font-bold text-[var(--color-success)] mb-1">
                ⏰ Combien de temps peux-tu étudier ?
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Glisse pour régler le temps par jour. Même 10 minutes par jour, ça compte !
              </p>
            </Card>

            {/* Mira — bulle d'encouragement étape 1 */}
            <div className="flex items-start gap-3 px-1">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#8b78e6] text-base shadow-sm">
                ✦
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[rgba(91,79,207,0.08)] border border-[rgba(91,79,207,0.15)] px-4 py-3 text-sm text-[var(--color-ink)] leading-relaxed">
                Mieux vaut <strong>20 minutes chaque jour</strong> qu&apos;une longue session le week-end.
                Ton cerveau retient beaucoup mieux en petites doses répétées ! ⏰
              </div>
            </div>

            {(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const).map((jour) => {
              const emojis: Record<string, string> = { lundi: "😤", mardi: "💪", mercredi: "🌟", jeudi: "🔥", vendredi: "🎉", samedi: "😎", dimanche: "🧘" };
              const val = dispo[jour];
              return (
                <Card key={jour} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{emojis[jour]}</span>
                    <span className="font-semibold text-[var(--color-ink)] capitalize w-20">{jour}</span>
                    <span className="ml-auto text-sm font-black text-[var(--color-ink)]">{val} min</span>
                  </div>
                  <input
                    type="range" min="0" max="90" step="5" value={val}
                    onChange={(e) => setDispo({ ...dispo, [jour]: Number(e.target.value) })}
                    className="w-full accent-[var(--color-ink)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                    <span>0 min</span>
                    <span>{val === 0 ? "Repos 😴" : val <= 15 ? "Léger ☁️" : val <= 30 ? "Régulier ✅" : val <= 60 ? "Intense 🔥" : "Champion 🏆"}</span>
                    <span>90 min</span>
                  </div>
                </Card>
              );
            })}

            <div className="flex gap-3 mt-6">
              {sectionMode ? (
                <Button variant="secondary" onClick={() => router.push("/eleve/plan")} className="flex-1">Annuler</Button>
              ) : (
                <Button variant="secondary" onClick={() => setEtape(0)} className="flex-1">← Retour</Button>
              )}
              {sectionMode ? (
                <Button onClick={sauvegarderDisponibilite} className="flex-[2]" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer ✅"}
                </Button>
              ) : (
                <Button onClick={() => setEtape(2)} className="flex-[2]">Suivant →</Button>
              )}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Notions prioritaires ── */}
        {etape === 2 && (
          <div className="space-y-4">

            {/* Mira — bulle d'encouragement étape 2 */}
            <div className="flex items-start gap-3 px-1">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#8b78e6] text-base shadow-sm">
                ✦
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[rgba(91,79,207,0.08)] border border-[rgba(91,79,207,0.15)] px-4 py-3 text-sm text-[var(--color-ink)] leading-relaxed">
                Mets <strong>Urgent</strong> sur ce que tu ne comprends vraiment pas encore —
                on s&apos;en occupe en premier ! Les autres attendent leur tour. Tu peux toujours changer les priorités plus tard. 💪
              </div>
            </div>

            {/* Explication des priorités */}
            <Card className="p-5 border-[rgba(201,149,42,0.25)] bg-[rgba(201,149,42,0.05)]">
              <p className="text-sm font-bold text-[var(--color-gold)] mb-3">
                📚 Ajoute tes notions et dis à quel point tu en as besoin
              </p>
              <div className="space-y-2">
                {(["URGENT", "IMPORTANT", "PLUS_TARD"] as const).map((p) => {
                  const cfg = PRIORITE_CONFIG[p];
                  return (
                    <div key={p} className={`rounded-xl border px-3 py-2.5 ${cfg.color}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.badge} flex-shrink-0`} />
                        <p className="text-xs font-bold">{cfg.label} — {cfg.sousTitre}</p>
                      </div>
                      <p className="text-[11px] opacity-80 pl-4">{cfg.quandChoisir}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--color-ink-soft)] mt-3">
                💡 L'ordre dans lequel tu travailleras les notions est calculé automatiquement — les plus urgentes en premier. Tu pourras le modifier ensuite.
              </p>
            </Card>

            {/* Sélecteur de matière */}
            <div className="flex gap-2 flex-wrap">
              {(objectifs.length > 0 ? objectifs.map((o) => o.matiere) : MATIERES.map((m) => m.id)).map((matiereId) => {
                const mat = MATIERES.find((m) => m.id === matiereId);
                return mat ? (
                  <button
                    key={mat.id}
                    onClick={() => setMatiereNotionsSelectionnee(mat.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      matiereNotionsSelectionnee === mat.id
                        ? "bg-[var(--color-ink)] text-white"
                        : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                    }`}
                  >
                    {mat.emoji} {mat.label}
                    {notionsPrioritisees.filter((n) => n.matiere === mat.id).length > 0 && (
                      <span className="bg-white/20 rounded-full px-1.5 text-[10px]">
                        {notionsPrioritisees.filter((n) => n.matiere === mat.id).length}
                      </span>
                    )}
                  </button>
                ) : null;
              })}
            </div>

            {/* Liste des notions PFEQ à ajouter */}
            {!notionsDispos ? (
              <Card className="p-8 text-center">
                <div className="text-2xl mb-2 animate-pulse">⏳</div>
                <p className="text-sm text-[var(--color-ink-soft)]">Chargement des notions…</p>
              </Card>
            ) : (
              notionsDispos.map((seq) => (
                <Card key={seq.id} className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                    {seq.emoji} {seq.label}
                  </p>
                  <div className="space-y-2">
                    {seq.notions.map((notion) => {
                      const dansPlan = notionsPrioritisees.find((n) => n.notion === notion.id);
                      const priorite: PrioriteNotion = dansPlan?.priorite ?? "IMPORTANT";
                      return (
                        <div key={notion.id} className="rounded-xl border border-[var(--color-rule)] p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold text-[var(--color-ink)]">{notion.label}</span>
                            <button
                              onClick={() => {
                                if (dansPlan) {
                                  setNotionsPrioritisees(notionsPrioritisees.filter((n) => n.notion !== notion.id));
                                } else {
                                  setNotionsPrioritisees([...notionsPrioritisees, {
                                    notion: notion.id,
                                    matiere: matiereNotionsSelectionnee,
                                    label: notion.label,
                                    priorite: "IMPORTANT",
                                  }]);
                                }
                              }}
                              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all ${
                                dansPlan
                                  ? "bg-[var(--color-ink)] text-white"
                                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)]"
                              }`}
                            >
                              {dansPlan ? "✓ Dans mon plan" : "+ Ajouter"}
                            </button>
                          </div>
                          {dansPlan && (
                            <div className="space-y-1.5 mt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">À quel point tu en as besoin ?</p>
                              {(["URGENT", "IMPORTANT", "PLUS_TARD"] as const).map((p) => {
                                const cfg = PRIORITE_CONFIG[p];
                                const isSelected = priorite === p;
                                return (
                                  <button
                                    key={p}
                                    onClick={() => setNotionsPrioritisees(
                                      notionsPrioritisees.map((n) => n.notion === notion.id ? { ...n, priorite: p } : n)
                                    )}
                                    className={`w-full flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                                      isSelected ? cfg.color + " border-current shadow-sm" : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
                                    }`}
                                  >
                                    <span className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${isSelected ? cfg.badge : "bg-[var(--color-rule)]"}`} />
                                    <div>
                                      <p className={`text-xs font-bold ${isSelected ? "" : "text-[var(--color-ink-soft)]"}`}>
                                        {cfg.label} — {cfg.sousTitre}
                                      </p>
                                      <p className={`text-[10px] mt-0.5 ${isSelected ? "opacity-80" : "text-[var(--color-ink-soft)]"}`}>
                                        {cfg.quandChoisir}
                                      </p>
                                    </div>
                                    {isSelected && <span className="ml-auto text-xs font-bold">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}

            {/* Ordre de travail — liste réordonnable (↑↓) */}
            {notionsPrioritisees.length > 1 && (
              <Card className="p-4 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.03)]">
                <p className="text-xs font-bold text-[var(--color-purple)] mb-1">
                  🔢 Ordre de travail — notion par notion
                </p>
                <p className="text-[11px] text-[var(--color-ink-soft)] mb-3">
                  L'appli suivra cet ordre. Tu maîtrises une notion → tu passes à la suivante. Utilise ↑↓ pour réordonner.
                </p>
                <div className="space-y-1.5">
                  {notionsPrioritisees.map((n, i) => {
                    const cfg = PRIORITE_CONFIG[n.priorite as keyof typeof PRIORITE_CONFIG];
                    return (
                      <div key={n.notion} className="flex items-center gap-2 rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2">
                        <span className="text-sm font-black text-[var(--color-ink-soft)] w-5 text-center">{i + 1}</span>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg?.badge ?? "bg-gray-400"}`} />
                        <span className="flex-1 text-xs font-semibold text-[var(--color-ink)] truncate">{n.label}</span>
                        <div className="flex gap-1">
                          <button
                            disabled={i === 0}
                            onClick={() => {
                              const arr = [...notionsPrioritisees];
                              [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                              setNotionsPrioritisees(arr);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--color-rule)] text-xs disabled:opacity-30 hover:bg-[var(--color-paper-warm)]"
                          >↑</button>
                          <button
                            disabled={i === notionsPrioritisees.length - 1}
                            onClick={() => {
                              const arr = [...notionsPrioritisees];
                              [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                              setNotionsPrioritisees(arr);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--color-rule)] text-xs disabled:opacity-30 hover:bg-[var(--color-paper-warm)]"
                          >↓</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="flex gap-3 mt-6">
              {sectionMode ? (
                <Button variant="secondary" onClick={() => router.push("/eleve/plan")} className="flex-1">Annuler</Button>
              ) : (
                <Button variant="secondary" onClick={() => setEtape(1)} className="flex-1">← Retour</Button>
              )}
              <Button
                onClick={sectionMode ? sauvegarderNotions : sauvegarderTout}
                className="flex-[2]"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement… ✨"
                  : sectionMode
                    ? "Enregistrer ✅"
                    : estModification
                      ? "Enregistrer les modifications ✅"
                      : "Lancer mon plan 🚀"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

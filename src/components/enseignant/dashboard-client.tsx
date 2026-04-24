"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckIn = { id: string; etat: string; modeDoux: boolean; date: Date | string };
type Exercice = { score: number | null; dateFin: Date | string | null };
type NiveauMatiere = { matiere: string; scoreGlobal: number; niveau: string };
type PlanAction = { id: string; titre: string };

export type EleveResume = {
  id: string;
  prenom: string;
  nom: string;
  niveauScolaire: string;
  ecole: string | null;
  streakJours: number;
  derniereConnexion: Date | string | null;
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  checkIns: CheckIn[];
  exercicesAssignes: Exercice[];
  niveauxMatieres: NiveauMatiere[];
  badges: { id: string }[];
  planActions: PlanAction[];
};

// ── Constantes ────────────────────────────────────────────────────────────────

const NIVEAUX_LABELS: Record<string, string> = {
  PRIMAIRE_1: "1re primaire", PRIMAIRE_2: "2e primaire", PRIMAIRE_3: "3e primaire",
  PRIMAIRE_4: "4e primaire", PRIMAIRE_5: "5e primaire", PRIMAIRE_6: "6e primaire",
  SECONDAIRE_1: "Sec. 1", SECONDAIRE_2: "Sec. 2", SECONDAIRE_3: "Sec. 3",
  SECONDAIRE_4: "Sec. 4", SECONDAIRE_5: "Sec. 5",
};

const ETATS_NEGATIFS = ["STRESSE", "TRISTE", "FATIGUE"];
const ETAT_EMOJI: Record<string, string> = {
  TRES_BIEN: "😄", BIEN: "🙂", CORRECT: "😐",
  FATIGUE: "😴", STRESSE: "😰", TRISTE: "😢",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function activityStatus(eleve: EleveResume): "today" | "week" | "inactive" {
  if (!eleve.derniereConnexion) return "inactive";
  const diff = Date.now() - new Date(eleve.derniereConnexion).getTime();
  if (diff < 24 * 3600 * 1000) return "today";
  if (diff < 7 * 24 * 3600 * 1000) return "week";
  return "inactive";
}

function scoreMoyen(eleve: EleveResume): number | null {
  const scores = eleve.exercicesAssignes.map(e => e.score).filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function scoreTendance(eleve: EleveResume): number | null {
  const scores = eleve.exercicesAssignes.map(e => e.score).filter((s): s is number => s !== null);
  if (scores.length < 3) return null;
  const recent = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const ancien = scores.slice(2).reduce((a, b) => a + b, 0) / scores.slice(2).length;
  return Math.round(recent - ancien);
}

function enAlerte(eleve: EleveResume): boolean {
  const recents = eleve.checkIns.slice(0, 3);
  return recents.length >= 2 && recents.every(c => ETATS_NEGATIFS.includes(c.etat));
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-[var(--color-success)]";
  if (score >= 60) return "text-[var(--color-gold)]";
  return "text-[var(--color-accent)]";
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  eleves: EleveResume[];
  total: number;
  analyses: { matiere: string; nbEleves: number; scoreMoyen: number; topLacunes: { lacune: string; count: number }[] }[];
}

export function EnseignantDashboardClient({ eleves, total, analyses }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterAlerte, setFilterAlerte] = useState(false);
  const [filterInactif, setFilterInactif] = useState(false);
  const [filterAdaptation, setFilterAdaptation] = useState(false);
  const [sortBy, setSortBy] = useState<"prenom" | "score" | "activite" | "alerte">("prenom");
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyseOuverte, setAnalyseOuverte] = useState(false);

  // Charger les épinglés depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("enseignant_pinned_v1");
      if (saved) setPinned(new Set(JSON.parse(saved) as string[]));
    } catch { /* silencieux */ }
  }, []);

  function togglePin(eleveId: string) {
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(eleveId)) next.delete(eleveId);
      else next.add(eleveId);
      try { localStorage.setItem("enseignant_pinned_v1", JSON.stringify([...next])); } catch { /* silencieux */ }
      return next;
    });
  }

  // ── Filtres et tri ──────────────────────────────────────────────────────────
  const elevesFiltrés = useMemo(() => {
    let list = [...eleves];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(q));
    }
    if (filterAlerte) list = list.filter(e => enAlerte(e));
    if (filterInactif) list = list.filter(e => activityStatus(e) === "inactive");
    if (filterAdaptation) list = list.filter(e => e.tdah || e.dyslexie || e.anxieteScolaire);

    list.sort((a, b) => {
      if (sortBy === "prenom") return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr");
      if (sortBy === "score") {
        const sa = scoreMoyen(a) ?? -1;
        const sb = scoreMoyen(b) ?? -1;
        return sb - sa;
      }
      if (sortBy === "activite") {
        const order = { today: 0, week: 1, inactive: 2 };
        return order[activityStatus(a)] - order[activityStatus(b)];
      }
      if (sortBy === "alerte") {
        return (enAlerte(b) ? 1 : 0) - (enAlerte(a) ? 1 : 0);
      }
      return 0;
    });

    return list;
  }, [eleves, search, filterAlerte, filterInactif, filterAdaptation, sortBy]);

  const elevesEpinglés = eleves.filter(e => pinned.has(e.id));

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const elevesActifs = eleves.filter(e => activityStatus(e) !== "inactive").length;
  const elevesEnAlerte = eleves.filter(e => enAlerte(e)).length;
  const exercicesSemaine = eleves.reduce((acc, e) => {
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return acc + e.exercicesAssignes.filter(ex => ex.dateFin && new Date(ex.dateFin) > cutoff).length;
  }, 0);
  const scoreMoyenClasse = eleves.length > 0
    ? Math.round(eleves.map(e => scoreMoyen(e) ?? 0).reduce((a, b) => a + b, 0) / eleves.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Mes élèves</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">Suivi pédagogique en temps réel</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[var(--color-ink)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          + Ajouter un élève
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard icon="👥" value={total} label="Élèves suivis" />
        <KpiCard icon="🟢" value={elevesActifs} label="Actifs cette semaine" color="success" />
        <KpiCard icon="💙" value={elevesEnAlerte} label="Soutien recommandé" color={elevesEnAlerte > 0 ? "accent" : "success"} />
        <KpiCard icon="⚡" value={exercicesSemaine} label="Exercices cette semaine" />
        <KpiCard icon="📊" value={`${scoreMoyenClasse}%`} label="Score moyen classe"
          color={scoreMoyenClasse >= 75 ? "success" : scoreMoyenClasse >= 60 ? "gold" : "accent"} />
      </div>

      {/* ── Élèves vide ── */}
      {eleves.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">Aucun élève pour l'instant</h2>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            Ajoutez vos premiers élèves en cliquant sur « Ajouter un élève » et en entrant leur code d'accès.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            + Ajouter mon premier élève
          </button>
        </Card>
      )}

      {/* ── Épinglés ── */}
      {elevesEpinglés.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            ⭐ Élèves suivis de près ({elevesEpinglés.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {elevesEpinglés.map(e => (
              <CarteEpingle key={e.id} eleve={e} pinned onTogglePin={() => togglePin(e.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Liste complète ── */}
      {eleves.length > 0 && (
        <div>
          {/* Barre de recherche + filtres */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] text-sm">🔍</span>
              <input
                type="text"
                placeholder="Rechercher un élève…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white pl-8 pr-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterPill active={filterAlerte} onClick={() => setFilterAlerte(v => !v)} label="💙 En alerte" />
              <FilterPill active={filterInactif} onClick={() => setFilterInactif(v => !v)} label="🔴 Inactifs" />
              <FilterPill active={filterAdaptation} onClick={() => setFilterAdaptation(v => !v)} label="🧠 Adaptations" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] focus:outline-none cursor-pointer"
              >
                <option value="prenom">Trier : Nom A→Z</option>
                <option value="score">Trier : Score ↓</option>
                <option value="activite">Trier : Activité récente</option>
                <option value="alerte">Trier : Alertes d'abord</option>
              </select>
            </div>
          </div>

          {/* Compteur résultats */}
          <p className="text-xs text-[var(--color-ink-soft)] mb-3">
            {elevesFiltrés.length} élève{elevesFiltrés.length > 1 ? "s" : ""}
            {elevesFiltrés.length !== total ? ` sur ${total}` : ""}
          </p>

          {/* Tableau */}
          {elevesFiltrés.length === 0 ? (
            <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">
              Aucun élève ne correspond à vos filtres.
            </Card>
          ) : (
            <div className="space-y-2">
              {elevesFiltrés.map(eleve => (
                <LigneEleve
                  key={eleve.id}
                  eleve={eleve}
                  epingle={pinned.has(eleve.id)}
                  onTogglePin={() => togglePin(eleve.id)}
                  onRetirer={() => router.refresh()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Analyse de classe (collapsible) ── */}
      {analyses.length > 0 && (
        <div>
          <button
            onClick={() => setAnalyseOuverte(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors mb-3"
          >
            <span className={`transition-transform ${analyseOuverte ? "rotate-90" : ""}`}>▶</span>
            📊 Analyse de classe — Lacunes collectives ({analyses.length} matière{analyses.length > 1 ? "s" : ""})
          </button>
          {analyseOuverte && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {analyses.map(a => (
                <AnalyseCard key={a.matiere} analyse={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ajouter élève ── */}
      {showAddModal && <AjouterEleveModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); router.refresh(); }} />}
    </div>
  );
}

// ── Carte élève épinglé ───────────────────────────────────────────────────────

function CarteEpingle({ eleve, pinned, onTogglePin }: { eleve: EleveResume; pinned: boolean; onTogglePin: () => void }) {
  const score = scoreMoyen(eleve);
  const tendance = scoreTendance(eleve);
  const alerte = enAlerte(eleve);
  const activite = activityStatus(eleve);
  const checkIn = eleve.checkIns[0];

  return (
    <Card className={`p-4 relative ${alerte ? "border-[rgba(217,79,43,0.3)]" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-base font-black text-white ${alerte ? "bg-[var(--color-accent)]" : "bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-accent)]"}`}>
            {eleve.prenom.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--color-ink)] leading-tight">{eleve.prenom} {eleve.nom}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">{NIVEAUX_LABELS[eleve.niveauScolaire] ?? eleve.niveauScolaire}</p>
          </div>
        </div>
        <button onClick={onTogglePin} className="text-base leading-none" title="Désépingler">
          {pinned ? "⭐" : "☆"}
        </button>
      </div>

      {/* Score + tendance */}
      <div className="flex items-center gap-3 mb-3">
        {score !== null && (
          <div>
            <span className={`text-xl font-black ${scoreColor(score)}`}>{score}%</span>
            {tendance !== null && (
              <span className={`ml-1 text-xs font-semibold ${tendance > 0 ? "text-[var(--color-success)]" : tendance < 0 ? "text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`}>
                {tendance > 0 ? `↑ +${tendance}` : tendance < 0 ? `↓ ${tendance}` : "→"}
              </span>
            )}
          </div>
        )}
        <ActivityDot status={activite} />
        {checkIn && <span className="text-base">{ETAT_EMOJI[checkIn.etat] ?? "❓"}</span>}
      </div>

      {/* Badges adaptations */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {alerte && <Pill color="accent" label="💙 Soutien" />}
        {eleve.tdah && <Pill color="gold" label="TDAH" />}
        {eleve.dyslexie && <Pill color="gold" label="Dyslexie" />}
        {eleve.planActions.length > 0 && <Pill color="success" label="✓ Plan actif" />}
      </div>

      {/* Activité 7 jours */}
      <ActivityDots7 exercices={eleve.exercicesAssignes} />

      <Link href={`/enseignant/eleve/${eleve.id}`} className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
        Voir le détail →
      </Link>
    </Card>
  );
}

// ── Ligne élève (tableau) ─────────────────────────────────────────────────────

function LigneEleve({ eleve, epingle, onTogglePin, onRetirer }: {
  eleve: EleveResume;
  epingle: boolean;
  onTogglePin: () => void;
  onRetirer: () => void;
}) {
  const score = scoreMoyen(eleve);
  const tendance = scoreTendance(eleve);
  const alerte = enAlerte(eleve);
  const activite = activityStatus(eleve);
  const checkIn = eleve.checkIns[0];

  const retirer = trpc.enseignant.retirerEleve.useMutation({ onSuccess: onRetirer });

  return (
    <Card className={`px-4 py-3 hover:shadow-[var(--shadow-elevated)] transition-shadow ${alerte ? "border-[rgba(217,79,43,0.2)] bg-[rgba(217,79,43,0.01)]" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${alerte ? "bg-[var(--color-accent)]" : "bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-accent)]"}`}>
          {eleve.prenom.charAt(0)}
        </div>

        {/* Nom + niveau */}
        <div className="w-40 flex-shrink-0 min-w-0">
          <p className="text-sm font-bold text-[var(--color-ink)] truncate">{eleve.prenom} {eleve.nom}</p>
          <p className="text-xs text-[var(--color-ink-soft)] truncate">{NIVEAUX_LABELS[eleve.niveauScolaire] ?? eleve.niveauScolaire}</p>
        </div>

        {/* Activité */}
        <div className="hidden sm:flex items-center gap-1.5 w-28 flex-shrink-0">
          <ActivityDot status={activite} />
          <span className="text-xs text-[var(--color-ink-soft)]">
            {activite === "today" ? "Aujourd'hui" : activite === "week" ? "Cette semaine" : "Inactif"}
          </span>
        </div>

        {/* Score + tendance */}
        <div className="hidden sm:flex items-center gap-1.5 w-24 flex-shrink-0">
          {score !== null ? (
            <>
              <span className={`text-sm font-black ${scoreColor(score)}`}>{score}%</span>
              {tendance !== null && (
                <span className={`text-xs font-semibold ${tendance > 0 ? "text-[var(--color-success)]" : tendance < 0 ? "text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`}>
                  {tendance > 0 ? `↑+${tendance}` : tendance < 0 ? `↓${tendance}` : "→"}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-[var(--color-ink-soft)]">—</span>
          )}
        </div>

        {/* Humeur */}
        <div className="hidden lg:flex w-8 flex-shrink-0 justify-center">
          {checkIn ? <span className="text-base">{ETAT_EMOJI[checkIn.etat] ?? "❓"}</span> : <span className="text-xs text-[var(--color-ink-soft)]">—</span>}
        </div>

        {/* Tags */}
        <div className="flex-1 hidden md:flex items-center gap-1.5 flex-wrap">
          {alerte && <Pill color="accent" label="💙 Soutien" />}
          {eleve.tdah && <Pill color="gold" label="TDAH" />}
          {eleve.dyslexie && <Pill color="gold" label="Dyslexie" />}
          {eleve.planActions.length > 0 && <Pill color="success" label="✓ Plan" />}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button onClick={onTogglePin} title={epingle ? "Désépingler" : "Épingler"} className="text-base leading-none hover:scale-110 transition-transform">
            {epingle ? "⭐" : "☆"}
          </button>
          <Link href={`/enseignant/eleve/${eleve.id}`} className="rounded-xl border border-[var(--color-rule)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors">
            Détail →
          </Link>
          <button
            onClick={() => { if (confirm(`Retirer ${eleve.prenom} de votre liste ?`)) retirer.mutate({ eleveId: eleve.id }); }}
            disabled={retirer.isPending}
            aria-label={`Retirer ${eleve.prenom} de ma liste`}
            className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Modal ajouter élève ───────────────────────────────────────────────────────

function AjouterEleveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [succesPrenom, setSuccesPrenom] = useState<string | null>(null);

  const ajouter = trpc.enseignant.ajouterEleve.useMutation({
    onSuccess: (data) => {
      setSuccesPrenom(`${data.prenom} ${data.nom}`);
      setCode("");
      setTimeout(onSuccess, 1500);
    },
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-[var(--color-paper)] shadow-[0_32px_80px_rgba(15,22,35,0.25)] overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* En-tête */}
          <div className="bg-[var(--color-ink)] px-6 pt-6 pb-5 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xs font-semibold">✕ Fermer</button>
            <div className="text-3xl mb-2">👤</div>
            <h2 className="text-base font-black text-white">Ajouter un élève</h2>
            <p className="text-white/50 text-xs mt-1">Entrez le code d'accès de l'élève</p>
          </div>

          {/* Corps */}
          <div className="px-6 py-5">
            {succesPrenom ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-[var(--color-ink)]">{succesPrenom} a été ajouté(e) !</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">Redirection en cours…</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); if (code.trim()) ajouter.mutate({ codeAcces: code.trim() }); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                    Code d'accès de l'élève
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="ex: Emma-483921"
                    autoFocus
                    className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2.5 text-sm font-mono text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none"
                  />
                  <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">
                    Le code d'accès se trouve dans le profil de l'élève ou peut être communiqué par le parent.
                  </p>
                </div>

                {ajouter.isError && (
                  <div className="rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-4 py-3">
                    <p className="text-xs font-medium text-[var(--color-accent)]">
                      {ajouter.error?.message ?? "Une erreur s'est produite."}
                    </p>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button type="button" onClick={onClose}
                    className="flex-1 rounded-2xl border border-[var(--color-rule)] bg-white py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={!code.trim() || ajouter.isPending}
                    className="flex-[2] rounded-2xl bg-[var(--color-ink)] py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                    {ajouter.isPending ? "Recherche…" : "Ajouter l'élève"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Carte analyse de classe ───────────────────────────────────────────────────

const MATIERE_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

function AnalyseCard({ analyse }: { analyse: { matiere: string; nbEleves: number; scoreMoyen: number; topLacunes: { lacune: string; count: number }[] } }) {
  const barColor = analyse.scoreMoyen >= 75 ? "bg-[var(--color-success)]" : analyse.scoreMoyen >= 60 ? "bg-[var(--color-gold)]" : "bg-[var(--color-accent)]";
  const textColor = analyse.scoreMoyen >= 75 ? "text-[var(--color-success)]" : analyse.scoreMoyen >= 60 ? "text-[var(--color-gold)]" : "text-[var(--color-accent)]";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-[var(--color-ink)]">{MATIERE_LABELS[analyse.matiere] ?? analyse.matiere}</span>
        <span className={`text-sm font-black ${textColor}`}>{analyse.scoreMoyen}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--color-rule)] mb-3">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, analyse.scoreMoyen)}%` }} />
      </div>
      <p className="text-[10px] text-[var(--color-ink-soft)] mb-2">{analyse.nbEleves} élève{analyse.nbEleves > 1 ? "s" : ""} avec lacunes</p>
      <ul className="space-y-1">
        {analyse.topLacunes.map(l => (
          <li key={l.lacune} className="flex items-start gap-2 text-xs text-[var(--color-ink)]">
            <span className="flex-shrink-0 rounded-full bg-[rgba(217,79,43,0.10)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-accent)]">×{l.count}</span>
            <span className="leading-snug">{l.lacune}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ── Sous-composants utilitaires ───────────────────────────────────────────────

function KpiCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: "success" | "gold" | "accent" }) {
  const cls = color === "success" ? "text-[var(--color-success)]" : color === "gold" ? "text-[var(--color-gold)]" : color === "accent" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]";
  return (
    <Card className="p-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-black ${cls}`}>{value}</div>
      <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5 leading-tight">{label}</div>
    </Card>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${active ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "bg-white text-[var(--color-ink-soft)] border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"}`}>
      {label}
    </button>
  );
}

function Pill({ color, label }: { color: "accent" | "gold" | "success"; label: string }) {
  const cls = color === "accent" ? "bg-[rgba(217,79,43,0.10)] text-[var(--color-accent)]"
    : color === "gold" ? "bg-[rgba(201,149,42,0.10)] text-[var(--color-gold)]"
    : "bg-[rgba(42,124,111,0.10)] text-[var(--color-success)]";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{label}</span>;
}

function ActivityDot({ status }: { status: "today" | "week" | "inactive" }) {
  const cls = status === "today" ? "bg-[var(--color-success)]" : status === "week" ? "bg-[var(--color-gold)]" : "bg-[var(--color-rule)]";
  const title = status === "today" ? "Actif aujourd'hui" : status === "week" ? "Actif cette semaine" : "Inactif 7+ jours";
  return <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${cls}`} title={title} />;
}

function ActivityDots7({ exercices }: { exercices: Exercice[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const actif = exercices.some(ex => ex.dateFin && new Date(ex.dateFin) >= d && new Date(ex.dateFin) < next);
    return { actif, label: d.toLocaleDateString("fr-CA", { weekday: "short" }) };
  });
  return (
    <div className="flex items-center gap-1">
      {days.map((d, i) => (
        <div key={i} title={d.label} className={`h-2 flex-1 rounded-sm ${d.actif ? "bg-[var(--color-success)]" : "bg-[var(--color-rule)]"}`} />
      ))}
      <span className="text-[10px] text-[var(--color-ink-soft)] ml-1">7j</span>
    </div>
  );
}

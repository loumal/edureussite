"use client";

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { Matiere, NiveauScolaire, TypeExercice, NiveauDifficulte, SourceEpreuve, TypeModeleEpreuve } from "@/generated/prisma";

const MATIERES = [
  { value: "FRANCAIS", label: "Français" },
  { value: "MATHEMATIQUES", label: "Mathématiques" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "UNIVERS_SOCIAL", label: "Univers social" },
  { value: "ARTS", label: "Arts" },
  { value: "ANGLAIS", label: "Anglais" },
  { value: "EDUCATION_PHYSIQUE", label: "Éducation physique" },
  { value: "ETHIQUE", label: "Éthique" },
];

const NIVEAUX = [
  { value: "PRIMAIRE_1", label: "1re primaire" },
  { value: "PRIMAIRE_2", label: "2e primaire" },
  { value: "PRIMAIRE_3", label: "3e primaire" },
  { value: "PRIMAIRE_4", label: "4e primaire" },
  { value: "PRIMAIRE_5", label: "5e primaire" },
  { value: "PRIMAIRE_6", label: "6e primaire" },
  { value: "SECONDAIRE_1", label: "1re secondaire" },
  { value: "SECONDAIRE_2", label: "2e secondaire" },
  { value: "SECONDAIRE_3", label: "3e secondaire" },
  { value: "SECONDAIRE_4", label: "4e secondaire" },
  { value: "SECONDAIRE_5", label: "5e secondaire" },
];

const SOURCES = [
  { value: "MEES_OFFICIEL", label: "MEES Officiel" },
  { value: "COMMISSION_SCOLAIRE", label: "Commission scolaire" },
  { value: "MANUEL_SCOLAIRE", label: "Manuel scolaire" },
  { value: "AUTRE", label: "Autre" },
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const ACCEPTED_MIME = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain";

type Etape = "meta" | "upload" | "sections";

interface StructureAnalysee {
  titre: string;
  totalPoints: number;
  dureeMinutes: number;
  description: string;
  styleGeneral: string;
  competencesGlobales: string[];
  niveauLangue: string;
  consignesGenerales?: string;
  sections: {
    ordre: number;
    titre: string;
    typeQuestion: TypeExercice;
    nombreQuestions: number;
    pointsTotal: number;
    competencesPFEQ: string[];
    difficulte: NiveauDifficulte;
    instructions?: string;
    exempleQuestion?: object;
  }[];
}

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "docx" || ext === "doc") return "📝";
  return "📃";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function NouveauEpreuveForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [etape, setEtape] = useState<Etape>("meta");
  const [erreur, setErreur] = useState<string | null>(null);

  // Méta
  const [matiere, setMatiere] = useState<Matiere | "">("");
  const [niveauScolaire, setNiveauScolaire] = useState<NiveauScolaire | "">("");
  const [source, setSource] = useState<SourceEpreuve>("MEES_OFFICIEL");
  const [annee, setAnnee] = useState("");
  const [typeModele, setTypeModele] = useState<TypeModeleEpreuve>("EPREUVE_COMPLETE");
  const [notion, setNotion] = useState("");

  // Upload
  const [fichierNom, setFichierNom] = useState<string | null>(null);
  const [fichierTaille, setFichierTaille] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [etapeAnalyse, setEtapeAnalyse] = useState<"extraction" | "analyse" | null>(null);
  const [contenuExtrait, setContenuExtrait] = useState("");

  // Structure analysée
  const [structure, setStructure] = useState<StructureAnalysee | null>(null);
  const [titreOverride, setTitreOverride] = useState("");

  const creer = trpc.admin.creerEpreuve.useMutation({
    onSuccess: (data) => router.push(`/admin/epreuves/${data.id}`),
    onError: (err) => setErreur(err.message),
  });

  const handleFichier = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(`.${ext}`)) {
      setErreur("Format non supporté. Utilisez PDF, Word (.docx) ou texte (.txt).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErreur("Fichier trop volumineux (max 20 Mo).");
      return;
    }
    if (!matiere || !niveauScolaire) {
      setErreur("Veuillez d'abord sélectionner la matière et le niveau.");
      return;
    }

    setFichierNom(file.name);
    setFichierTaille(file.size);
    setErreur(null);
    setEnCours(true);
    setEtapeAnalyse("extraction");

    const fd = new FormData();
    fd.append("fichier", file);
    fd.append("matiere", matiere);
    fd.append("niveauScolaire", niveauScolaire);
    fd.append("typeModele", typeModele);

    try {
      // Brief delay so the "extraction" label is visible
      await new Promise((r) => setTimeout(r, 400));
      setEtapeAnalyse("analyse");

      const res = await fetch("/api/admin/analyser-epreuve-doc", { method: "POST", body: fd });
      const data = await res.json() as { structure?: StructureAnalysee; contenuExtrait?: string; nomFichier?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Erreur d'analyse");

      setContenuExtrait(data.contenuExtrait ?? "");
      setStructure(data.structure!);
      setTitreOverride(data.structure!.titre);
      setEtape("sections");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inattendue. Réessayez.");
      setFichierNom(null);
    } finally {
      setEnCours(false);
      setEtapeAnalyse(null);
    }
  }, [matiere, niveauScolaire]);

  const handleCreer = () => {
    if (!structure || !matiere || !niveauScolaire) return;
    creer.mutate({
      titre: titreOverride || structure.titre,
      matiere,
      niveauScolaire,
      source,
      annee: annee ? parseInt(annee) : undefined,
      description: structure.description,
      contenuOriginal: contenuExtrait || undefined,
      structureAnalysee: structure as never,
      totalPoints: structure.totalPoints,
      dureeMinutes: structure.dureeMinutes,
      typeModele,
      notion: typeModele === "CONSOLIDATION" && notion.trim() ? notion.trim() : undefined,
      sections: structure.sections,
    });
  };

  const ETAPES_LABELS = ["Métadonnées", "Document", "Structure"];
  const etapeIdx = etape === "meta" ? 0 : etape === "upload" ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2">
        {ETAPES_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < etapeIdx
                  ? "bg-[var(--color-success)] text-white"
                  : i === etapeIdx
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
              }`}
            >
              {i < etapeIdx ? "✓" : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === etapeIdx ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
              {label}
            </span>
            {i < 2 && <div className="h-0.5 w-6 bg-[var(--color-rule)]" />}
          </div>
        ))}
      </div>

      {erreur && (
        <div className="rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-3 text-sm text-[var(--color-accent)]">
          {erreur}
        </div>
      )}

      {/* Étape 1 — Métadonnées */}
      {etape === "meta" && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-4">
          <h2 className="font-bold text-[var(--color-ink)]">1. Informations sur le modèle</h2>

          {/* Sélecteur type modèle */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "EPREUVE_COMPLETE", label: "📋 Épreuve complète", desc: "Épreuve de fin de cycle, bulletin" },
              { value: "CONSOLIDATION", label: "📝 Consolidation", desc: "Mini-composition par notion" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeModele(opt.value as TypeModeleEpreuve)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  typeModele === opt.value
                    ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]"
                    : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--color-ink)]">{opt.label}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Notion ciblée — uniquement pour consolidation */}
          {typeModele === "CONSOLIDATION" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Notion ciblée (optionnel)</label>
              <input
                type="text"
                value={notion}
                onChange={(e) => setNotion(e.target.value)}
                placeholder="Ex : fractions, aires et périmètres, accord du participe…"
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Matière *</label>
              <select
                value={matiere}
                onChange={(e) => setMatiere(e.target.value as Matiere)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                <option value="">Sélectionner…</option>
                {MATIERES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Niveau scolaire *</label>
              <select
                value={niveauScolaire}
                onChange={(e) => setNiveauScolaire(e.target.value as NiveauScolaire)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                <option value="">Sélectionner…</option>
                {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as SourceEpreuve)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Année (optionnel)</label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                placeholder="2024"
                min={2000}
                max={2030}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              if (!matiere || !niveauScolaire) { setErreur("Matière et niveau requis."); return; }
              setErreur(null);
              setEtape("upload");
            }}
          >
            Suivant →
          </Button>
        </div>
      )}

      {/* Étape 2 — Upload du document */}
      {etape === "upload" && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--color-ink)]">2. Déposer l'épreuve</h2>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              Claude extraira uniquement la structure — les questions originales ne seront pas stockées dans les exercices générés.
            </p>
          </div>

          {/* Zone drag & drop */}
          {!enCours && !fichierNom && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFichier(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
                ${isDragOver
                  ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]"
                  : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFichier(file);
                  e.target.value = "";
                }}
              />
              <div className="text-5xl select-none">📁</div>
              <div>
                <p className="font-semibold text-sm text-[var(--color-ink)]">
                  Glisser-déposer ou cliquer pour choisir
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                  PDF, Word (.docx) ou texte (.txt) · max 20 Mo
                </p>
              </div>
              <div className="flex gap-2 mt-1">
                {["PDF", "DOCX", "TXT"].map((fmt) => (
                  <span key={fmt} className="rounded-full border border-[var(--color-rule)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink-soft)]">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analyse en cours */}
          {enCours && (
            <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-6">
              {/* Fichier sélectionné */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--color-rule)] text-xl flex-shrink-0">
                  {fichierNom ? fileIcon(fichierNom) : "📄"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{fichierNom}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{formatSize(fichierTaille)}</p>
                </div>
              </div>

              {/* Étapes de progression */}
              <div className="space-y-3">
                <EtapeProgression
                  label="Lecture du document"
                  etat={etapeAnalyse === "extraction" ? "actif" : "fait"}
                />
                <EtapeProgression
                  label="Analyse de la structure par Claude"
                  etat={etapeAnalyse === "analyse" ? "actif" : etapeAnalyse === null ? "attente" : "attente"}
                />
              </div>
            </div>
          )}

          {/* Fichier uploadé avec succès (état transitoire avant navigation) */}
          {!enCours && fichierNom && etape === "upload" && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--color-rule)] text-xl flex-shrink-0">
                {fileIcon(fichierNom)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{fichierNom}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{formatSize(fichierTaille)}</p>
              </div>
              <button
                onClick={() => { setFichierNom(null); setErreur(null); }}
                className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors ml-2 flex-shrink-0"
              >
                Changer
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEtape("meta")} disabled={enCours}>
              ← Retour
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3 — Structure analysée */}
      {etape === "sections" && structure && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[var(--color-ink)]">3. Structure extraite par Claude</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  typeModele === "CONSOLIDATION"
                    ? "bg-[rgba(91,79,207,0.1)] text-[var(--color-purple)]"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
                }`}>
                  {typeModele === "CONSOLIDATION" ? "📝 Consolidation" : "📋 Épreuve complète"}
                </span>
              </div>
              {fichierNom && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-base">{fileIcon(fichierNom)}</span>
                  <span className="text-xs text-[var(--color-ink-soft)] truncate max-w-[200px]">{fichierNom}</span>
                </div>
              )}
              {typeModele === "CONSOLIDATION" && notion && (
                <p className="text-xs text-[var(--color-purple)] mt-1">Notion : {notion}</p>
              )}
            </div>
            <span className="rounded-full bg-[rgba(42,124,111,0.1)] px-2 py-0.5 text-xs font-semibold text-[var(--color-success)] flex-shrink-0">
              ✓ Aucun contenu copié
            </span>
          </div>

          {/* Titre éditable */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Titre du modèle</label>
            <input
              type="text"
              value={titreOverride}
              onChange={(e) => setTitreOverride(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
            />
          </div>

          {/* Infos générales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Total points</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.totalPoints}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Durée</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.dureeMinutes} min</p>
            </div>
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Sections</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.sections.length}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Description</p>
            <p className="text-sm text-[var(--color-ink)]">{structure.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Style général</p>
            <p className="text-sm text-[var(--color-ink)]">{structure.styleGeneral}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Sections détectées</p>
            <div className="space-y-3">
              {structure.sections.map((s, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-rule)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{s.ordre}. {s.titre}</p>
                    <span className="text-xs text-[var(--color-ink-soft)]">{s.nombreQuestions} q. · {s.pointsTotal} pts</span>
                  </div>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{s.typeQuestion} · {s.difficulte}</p>
                  {s.competencesPFEQ.length > 0 && (
                    <p className="text-xs text-[var(--color-success)] mt-1">PFEQ : {s.competencesPFEQ.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setEtape("upload"); setFichierNom(null); setStructure(null); setErreur(null); }}
            >
              ← Changer le document
            </Button>
            <Button variant="primary" onClick={handleCreer} disabled={creer.isPending}>
              {creer.isPending ? "Sauvegarde…" : "✅ Sauvegarder le modèle"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EtapeProgression({ label, etat }: { label: string; etat: "attente" | "actif" | "fait" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
        etat === "fait"
          ? "bg-[var(--color-success)] text-white"
          : etat === "actif"
          ? "bg-[var(--color-ink)] text-white"
          : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
      }`}>
        {etat === "fait" ? "✓" : etat === "actif" ? (
          <span className="inline-block animate-spin text-[10px]">◌</span>
        ) : "·"}
      </div>
      <span className={`text-sm ${etat === "actif" ? "font-semibold text-[var(--color-ink)]" : etat === "fait" ? "text-[var(--color-success)]" : "text-[var(--color-ink-soft)]"}`}>
        {label}
      </span>
      {etat === "actif" && (
        <span className="flex gap-0.5 ml-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink)] opacity-75"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

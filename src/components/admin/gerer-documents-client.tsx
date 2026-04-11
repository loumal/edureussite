"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPES = [
  { value: "RECHERCHE_SCIENTIFIQUE", label: "Recherche scientifique" },
  { value: "GUIDE_PEDAGOGIQUE", label: "Guide pédagogique" },
  { value: "STRATEGIE_INTERVENTION", label: "Stratégie d'intervention" },
  { value: "RESULTAT_ETUDE", label: "Résultat d'étude" },
  { value: "RESSOURCE_PARENTALE", label: "Ressource parentale" },
  { value: "AUTRE", label: "Autre document" },
] as const;

const MATIERES = [
  { value: "FRANCAIS", label: "Français" },
  { value: "MATHEMATIQUES", label: "Mathématiques" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "UNIVERS_SOCIAL", label: "Univers social" },
  { value: "ANGLAIS", label: "Anglais" },
  { value: "ARTS", label: "Arts" },
  { value: "ETHIQUE", label: "Éthique" },
  { value: "EDUCATION_PHYSIQUE", label: "Éd. physique" },
] as const;

const NIVEAUX_PRIMAIRE = [
  { value: "PRIMAIRE_1", label: "1re année" },
  { value: "PRIMAIRE_2", label: "2e année" },
  { value: "PRIMAIRE_3", label: "3e année" },
  { value: "PRIMAIRE_4", label: "4e année" },
  { value: "PRIMAIRE_5", label: "5e année" },
  { value: "PRIMAIRE_6", label: "6e année" },
] as const;

const NIVEAUX_SECONDAIRE = [
  { value: "SECONDAIRE_1", label: "Sec. 1" },
  { value: "SECONDAIRE_2", label: "Sec. 2" },
  { value: "SECONDAIRE_3", label: "Sec. 3" },
  { value: "SECONDAIRE_4", label: "Sec. 4" },
  { value: "SECONDAIRE_5", label: "Sec. 5" },
] as const;

type TypeDoc = typeof TYPES[number]["value"];
type MatiereVal = typeof MATIERES[number]["value"];
type NiveauVal = typeof NIVEAUX_PRIMAIRE[number]["value"] | typeof NIVEAUX_SECONDAIRE[number]["value"];
type SaisieMode = "texte" | "fichier";

const PROVINCES_ACTIVES_INFO: Record<string, { nom: string; langue: string }> = {
  QC: { nom: "Québec",                        langue: "FR" },
  ON: { nom: "Ontario",                        langue: "EN" },
  BC: { nom: "Colombie-Britannique",           langue: "EN" },
  AB: { nom: "Alberta",                        langue: "EN" },
  SK: { nom: "Saskatchewan",                   langue: "EN" },
  MB: { nom: "Manitoba",                       langue: "EN" },
  NB: { nom: "Nouveau-Brunswick",              langue: "FR/EN" },
  NS: { nom: "Nouvelle-Écosse",                langue: "EN" },
  PE: { nom: "Île-du-Prince-Édouard",          langue: "EN" },
  NL: { nom: "Terre-Neuve-et-Labrador",        langue: "EN" },
  YT: { nom: "Yukon",                          langue: "EN" },
  NT: { nom: "Territoires du Nord-Ouest",      langue: "EN" },
  NU: { nom: "Nunavut",                        langue: "EN" },
};

interface DocumentExistant {
  id: string;
  titre: string;
  type: TypeDoc;
  contenu: string;
  source: string;
  auteurs: string;
  annee?: number;
  motsCles: string[];
  matieres: string[];
  niveaux: string[];
  actif: boolean;
  province?: string;
  matiereLibre?: string;
  niveauLibre?: string;
}

interface Props {
  mode?: "ajouter" | "modifier";
  document?: DocumentExistant;
  multiProvince?: boolean;
  provincesActives?: Record<string, boolean>;
}

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function GererDocumentsClient({ mode = "ajouter", document: doc, multiProvince = false, provincesActives = {} }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saisieMode, setSaisieMode] = useState<SaisieMode>("texte");
  const [titre, setTitre] = useState(doc?.titre ?? "");
  const [type, setType] = useState<TypeDoc>(doc?.type ?? "RECHERCHE_SCIENTIFIQUE");
  const [contenu, setContenu] = useState(doc?.contenu ?? "");
  const [source, setSource] = useState(doc?.source ?? "");
  const [auteurs, setAuteurs] = useState(doc?.auteurs ?? "");
  const [annee, setAnnee] = useState(doc?.annee?.toString() ?? "");
  const [motsClesStr, setMotsClesStr] = useState(doc?.motsCles.join(", ") ?? "");
  const [matieres, setMatieres] = useState<MatiereVal[]>((doc?.matieres ?? []) as MatiereVal[]);
  const [niveaux, setNiveaux] = useState<NiveauVal[]>((doc?.niveaux ?? []) as NiveauVal[]);
  const [actif, setActif] = useState(doc?.actif ?? true);
  const [province, setProvince] = useState(doc?.province ?? "QC");
  const [matiereLibre, setMatiereLibre] = useState(doc?.matiereLibre ?? "");
  const [niveauLibre, setNiveauLibre] = useState(doc?.niveauLibre ?? "");

  const [fichierNom, setFichierNom] = useState<string>("");
  const [extractionErreur, setExtractionErreur] = useState<string>("");
  const [extractionEnCours, setExtractionEnCours] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (mode === "ajouter") {
      setTitre(""); setContenu(""); setSource(""); setAuteurs(""); setAnnee(""); setMotsClesStr("");
      setMatieres([]); setNiveaux([]); setFichierNom(""); setExtractionErreur("");
      setSaisieMode("texte"); setProvince("QC"); setMatiereLibre(""); setNiveauLibre("");
    }
    setOpen(false);
  };

  const ajouter = trpc.admin.ajouterDocument.useMutation({
    onSuccess: () => { reset(); router.refresh(); },
  });

  const modifier = trpc.admin.modifierDocument.useMutation({
    onSuccess: () => { setOpen(false); router.refresh(); },
  });

  const motsCles = motsClesStr.split(",").map(s => s.trim()).filter(Boolean);

  const isHorsQC = multiProvince && province !== "QC";

  const handleSubmit = () => {
    const provinceVal = multiProvince ? province as never : "QC" as never;
    if (mode === "ajouter") {
      ajouter.mutate({
        titre, type, contenu,
        source: source || undefined, auteurs: auteurs || undefined, annee: annee ? Number(annee) : undefined,
        motsCles,
        matieres: isHorsQC ? [] : matieres,
        niveaux: isHorsQC ? [] : niveaux,
        province: provinceVal,
        matiereLibre: isHorsQC ? (matiereLibre || undefined) : undefined,
        niveauLibre: isHorsQC ? (niveauLibre || undefined) : undefined,
      });
    } else if (doc) {
      modifier.mutate({
        id: doc.id, titre, contenu,
        source: source || undefined, auteurs: auteurs || undefined, annee: annee ? Number(annee) : undefined,
        motsCles,
        matieres: isHorsQC ? [] : matieres,
        niveaux: isHorsQC ? [] : niveaux,
        actif, province: provinceVal,
        matiereLibre: isHorsQC ? (matiereLibre || undefined) : null,
        niveauLibre: isHorsQC ? (niveauLibre || undefined) : null,
      });
    }
  };

  const extraireFichier = async (file: File) => {
    setExtractionErreur("");
    setExtractionEnCours(true);
    setFichierNom(file.name);
    setContenu("");

    const form = new FormData();
    form.append("fichier", file);

    try {
      const res = await fetch("/api/admin/extraire-doc-ia", { method: "POST", body: form });
      const data = await res.json() as { texte?: string; error?: string };
      if (!res.ok || data.error) {
        setExtractionErreur(data.error ?? "Erreur lors de l'extraction.");
      } else {
        setContenu(data.texte ?? "");
        // Pré-remplir le titre avec le nom du fichier si vide
        if (!titre && data.texte) {
          const nomSanExt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          setTitre(nomSanExt.charAt(0).toUpperCase() + nomSanExt.slice(1));
        }
      }
    } catch {
      setExtractionErreur("Erreur réseau. Réessayez.");
    } finally {
      setExtractionEnCours(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extraireFichier(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extraireFichier(file);
  };

  const isPending = ajouter.isPending || modifier.isPending;
  const error = ajouter.error ?? modifier.error;
  const canSubmit = titre && contenu.length >= 50 && !isPending && !extractionEnCours;

  if (!open) {
    if (mode === "modifier") {
      return (
        <button
          onClick={() => setOpen(true)}
          title="Modifier ce document"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      );
    }
    return (
      <Button onClick={() => setOpen(true)}>
        + Ajouter un document
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] px-6 py-4">
          <h2 className="text-lg font-black text-[var(--color-ink)]">
            {mode === "ajouter" ? "Ajouter un document" : "Modifier le document"}
          </h2>
          <button onClick={() => setOpen(false)} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Titre *</label>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre du document ou de la recherche" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeDoc)}
              disabled={mode === "modifier"}
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm focus:border-[var(--color-ink)] focus:outline-none disabled:opacity-60"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Province — visible seulement si l'expansion multi-province est activée */}
          {multiProvince && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">
                🇨🇦 Province ciblée *
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm focus:border-[var(--color-ink)] focus:outline-none"
              >
                {Object.entries(PROVINCES_ACTIVES_INFO)
                  .filter(([code]) => provincesActives[code])
                  .map(([code, info]) => (
                    <option key={code} value={code}>{code} — {info.nom} ({info.langue})</option>
                  ))}
              </select>
            </div>
          )}

          {/* Matières ciblées — QC : grille enum / autres provinces : texte libre */}
          {isHorsQC ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">
                  Matière (texte libre)
                </label>
                <Input value={matiereLibre} onChange={(e) => setMatiereLibre(e.target.value)} placeholder="Ex: Science 9, Language Arts…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">
                  Niveau scolaire (texte libre)
                </label>
                <Input value={niveauLibre} onChange={(e) => setNiveauLibre(e.target.value)} placeholder="Ex: Grade 9, Grade 4…" />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-2">
                  Matières ciblées
                  <span className="ml-2 font-normal opacity-70">(laisser vide = toutes les matières)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {MATIERES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMatieres(prev => toggleItem(prev, m.value as MatiereVal))}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors text-left ${
                        matieres.includes(m.value as MatiereVal)
                          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                          : "border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-2">
                  Niveaux scolaires ciblés
                  <span className="ml-2 font-normal opacity-70">(laisser vide = tous les niveaux)</span>
                </label>
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] text-[var(--color-ink-soft)] mb-1 font-medium uppercase tracking-wide">Primaire</p>
                    <div className="flex flex-wrap gap-1.5">
                      {NIVEAUX_PRIMAIRE.map((n) => (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => setNiveaux(prev => toggleItem(prev, n.value as NiveauVal))}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                            niveaux.includes(n.value as NiveauVal)
                              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                              : "border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--color-ink-soft)] mb-1 font-medium uppercase tracking-wide">Secondaire</p>
                    <div className="flex flex-wrap gap-1.5">
                      {NIVEAUX_SECONDAIRE.map((n) => (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => setNiveaux(prev => toggleItem(prev, n.value as NiveauVal))}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                            niveaux.includes(n.value as NiveauVal)
                              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                              : "border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Auteur(s)</label>
              <Input value={auteurs} onChange={(e) => setAuteurs(e.target.value)} placeholder="Nom des auteurs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Année</label>
              <Input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} placeholder="2023" min={1900} max={2030} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Source / Revue / Éditeur</label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex: Journal of Educational Psychology, Éd. De Boeck…" />
          </div>

          {/* Contenu — toggle texte / fichier */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--color-ink-soft)]">
                Contenu *
              </label>
              {/* Toggle saisie mode */}
              <div className="flex rounded-lg border border-[var(--color-rule)] overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSaisieMode("texte")}
                  className={`px-3 py-1 transition-colors ${
                    saisieMode === "texte"
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  ✏️ Saisie manuelle
                </button>
                <button
                  type="button"
                  onClick={() => setSaisieMode("fichier")}
                  className={`px-3 py-1 transition-colors ${
                    saisieMode === "fichier"
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  📎 Téléverser un fichier
                </button>
              </div>
            </div>

            {saisieMode === "fichier" && (
              <div className="mb-3">
                {/* Zone de dépôt */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]"
                      : "border-[var(--color-rule)] bg-[var(--color-paper)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  {extractionEnCours ? (
                    <>
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-ink)] border-t-transparent" />
                      <p className="text-sm font-medium text-[var(--color-ink)]">Analyse du document en cours…</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">Claude extrait le contenu pertinent</p>
                    </>
                  ) : fichierNom && contenu ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <p className="text-sm font-medium text-[var(--color-ink)]">{fichierNom}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">Contenu extrait — cliquez pour changer de fichier</p>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-ink-soft)]">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      <p className="text-sm font-medium text-[var(--color-ink)]">Glissez un fichier ici ou cliquez pour parcourir</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">PDF, JPG, PNG, WebP · Max 20 Mo</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {extractionErreur && (
                  <p className="mt-1.5 text-xs text-[var(--color-accent)]">{extractionErreur}</p>
                )}
              </div>
            )}

            {/* Textarea contenu — toujours visible */}
            <div>
              {saisieMode === "fichier" && contenu && (
                <p className="text-[11px] text-[var(--color-ink-soft)] mb-1">Contenu extrait — vous pouvez le modifier avant d&apos;enregistrer</p>
              )}
              {saisieMode === "texte" && (
                <p className="text-[11px] text-[var(--color-ink-soft)] mb-1">Résumé, conclusions clés, extraits pertinents</p>
              )}
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={saisieMode === "fichier" ? 6 : 8}
                placeholder={
                  saisieMode === "fichier"
                    ? "Le contenu extrait apparaîtra ici après l'analyse…"
                    : "Collez ici le résumé, les conclusions principales, les recommandations pratiques ou les extraits pertinents du document. L'IA utilisera ce texte pour enrichir ses conseils."
                }
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] resize-y focus:border-[var(--color-ink)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">
              Mots-clés
              <span className="ml-2 font-normal">(séparés par des virgules)</span>
            </label>
            <Input
              value={motsClesStr}
              onChange={(e) => setMotsClesStr(e.target.value)}
              placeholder="TDAH, anxiété scolaire, dyslexie, motivation…"
            />
          </div>

          {mode === "modifier" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif-doc"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="actif-doc" className="text-sm text-[var(--color-ink)]">Document actif (utilisé par l&apos;IA)</label>
            </div>
          )}

          {error && <p className="text-xs text-[var(--color-accent)]">{error.message}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-[2]"
            >
              {isPending ? "Enregistrement…" : mode === "ajouter" ? "Ajouter le document" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

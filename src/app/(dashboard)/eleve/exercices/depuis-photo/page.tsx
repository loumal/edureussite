"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Matiere, NiveauDifficulte } from "@/generated/prisma";

/* ── Types ── */
type TypeDetecte = "CONSOLIDATION" | "EPREUVE_COMPLETE" | "DEVOIRS" | "AUTRE";

interface QuestionExtraite {
  numero: number;
  enonce: string;
  type: "QCM" | "REPONSE_COURTE" | "CALCUL" | "VRAI_FAUX" | "DEVELOPPEMENT";
  choix?: string[];
  pointsAttribues?: number | null;
}

interface AnalyseResult {
  typeExercice: TypeDetecte;
  matiere: Matiere | "INCONNUE";
  niveauEstime: string;
  titre: string;
  notions: string[];
  contenuBrut: string;
  questions: QuestionExtraite[];
  pointsTotal: number | null;
  dureeMinutes: number | null;
  confidenceScore: number;
}

type Etape = "upload" | "analyse" | "preview" | "difficulte" | "generation";
type DifficulteVal = "BASE" | "ATTENDU" | "AVANCE";

/* ── Constantes ── */
const MATIERES_LABELS: Record<string, string> = {
  MATHEMATIQUES: "Mathématiques",
  FRANCAIS: "Français",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ANGLAIS: "Anglais",
  ARTS: "Arts",
  ETHIQUE: "Éthique",
  EDUCATION_PHYSIQUE: "Éducation physique",
  INCONNUE: "Matière non identifiée",
};

const MATIERES_EMOJI: Record<string, string> = {
  MATHEMATIQUES: "🔢",
  FRANCAIS: "✏️",
  SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍",
  ANGLAIS: "🗣️",
  ARTS: "🎨",
  ETHIQUE: "🤝",
  EDUCATION_PHYSIQUE: "⚽",
  INCONNUE: "📚",
};

const TYPE_CONFIG: Record<TypeDetecte, { label: string; emoji: string; color: string; bg: string }> = {
  CONSOLIDATION: {
    label: "Exercice de consolidation",
    emoji: "📝",
    color: "var(--color-success)",
    bg: "rgba(42,124,111,0.08)",
  },
  EPREUVE_COMPLETE: {
    label: "Épreuve complète",
    emoji: "📋",
    color: "var(--color-purple)",
    bg: "rgba(91,79,207,0.08)",
  },
  DEVOIRS: {
    label: "Devoir maison",
    emoji: "🏠",
    color: "var(--color-gold)",
    bg: "rgba(196,148,31,0.08)",
  },
  AUTRE: {
    label: "Autre exercice",
    emoji: "📖",
    color: "var(--color-ink-soft)",
    bg: "rgba(0,0,0,0.04)",
  },
};

const DIFFICULTES: {
  value: DifficulteVal;
  label: string;
  desc: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "BASE",
    label: "Facile",
    desc: "Pour reprendre confiance et réviser les bases.",
    emoji: "🌱",
    color: "var(--color-success)",
  },
  {
    value: "ATTENDU",
    label: "Intermédiaire",
    desc: "Le niveau attendu pour ton année.",
    emoji: "🎯",
    color: "var(--color-gold)",
  },
  {
    value: "AVANCE",
    label: "Difficile",
    desc: "Pour te dépasser avec des questions complexes.",
    emoji: "🔥",
    color: "var(--color-accent)",
  },
];

const MATIERES_DISPONIBLES: { value: Matiere; label: string; emoji: string }[] = [
  { value: "MATHEMATIQUES", label: "Mathématiques", emoji: "🔢" },
  { value: "FRANCAIS", label: "Français", emoji: "✏️" },
  { value: "SCIENCES", label: "Sciences", emoji: "🔬" },
  { value: "UNIVERS_SOCIAL", label: "Univers social", emoji: "🌍" },
  { value: "ANGLAIS", label: "Anglais", emoji: "🗣️" },
];

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function DepuisPhotoPage() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("upload");
  const [analyse, setAnalyse] = useState<AnalyseResult | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [difficulte, setDifficulte] = useState<DifficulteVal>("ATTENDU");
  const [matiereManuelle, setMatiereManuelle] = useState<Matiere | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraErreur, setCameraErreur] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Démarre le flux caméra quand le modal s'ouvre
  useEffect(() => {
    if (!cameraActive) return;
    let localStream: MediaStream | null = null;

    (async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        streamRef.current = localStream;
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        const e = err as Error;
        const msg =
          e.name === "NotAllowedError"
            ? "Permission refusée — autorise la caméra dans les paramètres du navigateur."
            : e.name === "NotFoundError"
            ? "Aucune caméra détectée sur cet appareil."
            : "Impossible d'accéder à la caméra. Vérifie les permissions.";
        setCameraErreur(msg);
        setCameraActive(false);
      }
    })();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraActive]);

  const fermerCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const analyserFichier = useCallback(async (fichier: File) => {
    setErreur(null);
    setEtape("analyse");

    if (fichier.type.startsWith("image/")) {
      const url = URL.createObjectURL(fichier);
      setPreview(url);
    } else {
      setPreview(null);
    }

    const formData = new FormData();
    formData.append("fichier", fichier);

    try {
      const res = await fetch("/api/exercices/depuis-photo", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'analyse");
      setAnalyse(json.analyse as AnalyseResult);
      setEtape("preview");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue");
      setEtape("upload");
    }
  }, []);

  const prendrePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo-exercice.jpg", { type: "image/jpeg" });
      fermerCamera();
      analyserFichier(file);
    }, "image/jpeg", 0.92);
  }, [fermerCamera, analyserFichier]);

  const generer = trpc.exercice.genererDepuisDocument.useMutation({
    onSuccess: (data) => {
      jouerSonNotification();
      router.push(`/eleve/exercices/${data.id}`);
    },
    onError: (err) => {
      setErreur(err.message);
      setEtape("difficulte");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyserFichier(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) analyserFichier(file);
  };

  const matiereFinale = (analyse?.matiere !== "INCONNUE" ? analyse?.matiere : null) ?? matiereManuelle;

  const handleGenerer = () => {
    if (!analyse || !matiereFinale) return;
    setEtape("generation");
    generer.mutate({
      contenuBrut: analyse.contenuBrut,
      questionsExtraites: analyse.questions,
      matiere: matiereFinale,
      typeDetecte: analyse.typeExercice,
      notions: analyse.notions,
      niveauEstime: analyse.niveauEstime !== "INCONNU" ? analyse.niveauEstime : undefined,
      difficulteChoisie: difficulte as NiveauDifficulte,
    });
  };

  /* ── ÉTAPE : UPLOAD ── */
  if (etape === "upload") {
    return (
      <>
      <div className="min-h-screen bg-[var(--color-paper)]">
        <div className="mx-auto max-w-lg px-4 py-10">
          <Link
            href="/eleve/exercices"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Mes exercices
          </Link>

          <div className="mb-8 text-center">
            <div className="text-5xl mb-3">📸</div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Importer un exercice</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2 max-w-sm mx-auto">
              Prends en photo ou téléverse un exercice — la plateforme l'analyse et te le génère
              en mode interactif avec correction automatique.
            </p>
          </div>

          {erreur && (
            <Card className="mb-4 p-4 border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]">
              <p className="text-sm text-[var(--color-accent)] font-medium">⚠️ {erreur}</p>
            </Card>
          )}

          {/* Zone de drop */}
          <Card
            className={`mb-4 p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
              isDragging
                ? "border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]"
                : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="font-bold text-[var(--color-ink)] mb-1">
              Glisse ton fichier ici
            </p>
            <p className="text-sm text-[var(--color-ink-soft)]">
              ou clique pour choisir depuis tes fichiers
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-3">
              JPG · PNG · WebP · PDF · max 10 Mo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />
          </Card>

          {/* Bouton caméra */}
          {cameraErreur && (
            <div className="mb-3 rounded-xl border border-[var(--color-gold)] bg-[rgba(196,148,31,0.06)] px-4 py-3">
              <p className="text-sm text-[var(--color-gold)]">⚠️ {cameraErreur}</p>
            </div>
          )}
          <button
            onClick={() => { setCameraErreur(null); setCameraActive(true); }}
            className="w-full rounded-2xl border-2 border-[var(--color-rule)] py-5 flex flex-col items-center gap-2 hover:border-[var(--color-ink-soft)] transition-all"
          >
            <span className="text-3xl">📷</span>
            <span className="font-bold text-sm text-[var(--color-ink)]">Prendre une photo</span>
            <span className="text-xs text-[var(--color-ink-soft)]">Ouvre la caméra directement</span>
          </button>

          {/* Info */}
          <div className="mt-6 rounded-xl bg-[var(--color-paper-warm)] px-4 py-3">
            <p className="text-xs font-bold text-[var(--color-ink)] mb-1">💡 Comment ça marche ?</p>
            <ol className="text-xs text-[var(--color-ink-soft)] space-y-1 list-decimal list-inside">
              <li>Prends en photo ou téléverse ton exercice</li>
              <li>L'IA identifie le type (consolidation, épreuve, devoir…)</li>
              <li>L'exercice est généré en mode interactif dans la plateforme</li>
              <li>Tu le fais et tu reçois une correction détaillée</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── Modal caméra ── */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Barre supérieure */}
          <div className="flex items-center justify-between px-5 py-4 bg-black/70 backdrop-blur-sm">
            <button
              onClick={fermerCamera}
              className="text-white/80 hover:text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              ✕ Annuler
            </button>
            <p className="text-white font-bold text-sm">Photographier l'exercice</p>
            <div className="w-20" />
          </div>

          {/* Viewfinder */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full object-contain"
            />
            {/* Cadre guide */}
            <div className="pointer-events-none absolute inset-6 rounded-2xl border border-white/25">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white" />
            </div>
            <p className="pointer-events-none absolute bottom-8 left-0 right-0 text-center text-xs text-white/50">
              Centre l'exercice dans le cadre
            </p>
          </div>

          {/* Bouton de capture */}
          <div className="flex items-center justify-center gap-10 py-8 bg-black/70 backdrop-blur-sm">
            <div className="w-12" />
            <button
              onClick={prendrePhoto}
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white active:scale-95 transition-transform"
              aria-label="Prendre la photo"
            >
              <div className="h-14 w-14 rounded-full bg-white" />
            </button>
            <div className="w-12" />
          </div>
        </div>
      )}
      </>
    );
  }

  /* ── ÉTAPE : ANALYSE ── */
  if (etape === "analyse") {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          {preview && (
            <div className="mx-auto mb-4 w-32 h-32 rounded-2xl overflow-hidden border border-[var(--color-rule)] shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-rule)]" />
            <div
              className="absolute inset-0 rounded-full border-4 border-t-[var(--color-accent)] border-r-transparent border-b-transparent border-l-transparent"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
          </div>
          <div>
            <p className="text-lg font-black text-[var(--color-ink)]">Analyse en cours…</p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              L'IA lit et identifie ton exercice
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE : PREVIEW ── */
  if (etape === "preview" && analyse) {
    const typeConfig = TYPE_CONFIG[analyse.typeExercice] ?? TYPE_CONFIG.AUTRE;
    const matiereLabel = MATIERES_LABELS[analyse.matiere] ?? analyse.matiere;
    const matiereEmoji = MATIERES_EMOJI[analyse.matiere] ?? "📚";
    const faible = analyse.confidenceScore < 0.5;

    return (
      <div className="min-h-screen bg-[var(--color-paper)]">
        <div className="mx-auto max-w-lg px-4 py-10">
          <button
            onClick={() => { setEtape("upload"); setAnalyse(null); setPreview(null); }}
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Recommencer
          </button>

          <h1 className="text-xl font-black text-[var(--color-ink)] mb-6">
            Exercice détecté ✅
          </h1>

          {faible && (
            <Card className="mb-4 p-4 border-[var(--color-gold)] bg-[rgba(196,148,31,0.06)]">
              <p className="text-sm text-[var(--color-gold)] font-medium">
                ⚠️ Image peu lisible — les résultats peuvent être imprécis. Vérifie les informations ci-dessous.
              </p>
            </Card>
          )}

          {/* Carte type */}
          <Card
            className="mb-4 p-4"
            style={{ borderColor: typeConfig.color, background: typeConfig.bg }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{typeConfig.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: typeConfig.color }}>
                  Type détecté
                </p>
                <p className="font-black text-[var(--color-ink)]">{typeConfig.label}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[var(--color-ink-soft)]">Confiance</p>
                <p className="font-black" style={{ color: typeConfig.color }}>
                  {Math.round(analyse.confidenceScore * 100)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Infos */}
          <Card className="mb-4 p-4 space-y-3">
            {analyse.titre && (
              <div>
                <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-1">Titre</p>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{analyse.titre}</p>
              </div>
            )}

            {/* Matière */}
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-1">Matière</p>
              {analyse.matiere !== "INCONNUE" ? (
                <div className="flex items-center gap-2">
                  <span>{matiereEmoji}</span>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{matiereLabel}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--color-gold)]">Matière non identifiée — choisis manuellement :</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MATIERES_DISPONIBLES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMatiereManuelle(m.value)}
                        className={`rounded-xl border py-2 text-center text-xs font-semibold transition-all ${
                          matiereManuelle === m.value
                            ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                            : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)]"
                        }`}
                      >
                        <div>{m.emoji}</div>
                        <div className="mt-0.5">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analyse.niveauEstime !== "INCONNU" && (
              <div>
                <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-1">Niveau estimé</p>
                <p className="text-sm text-[var(--color-ink)]">
                  {analyse.niveauEstime.replace("_", " ").replace("PRIMAIRE", "Primaire").replace("SECONDAIRE", "Secondaire")}
                </p>
              </div>
            )}

            {analyse.notions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-1">Notions identifiées</p>
                <div className="flex flex-wrap gap-1.5">
                  {analyse.notions.map((n, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-[var(--color-rule)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink)]"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(analyse.pointsTotal || analyse.dureeMinutes) && (
              <div className="flex gap-4">
                {analyse.pointsTotal && (
                  <div>
                    <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-0.5">Points</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{analyse.pointsTotal} pts</p>
                  </div>
                )}
                {analyse.dureeMinutes && (
                  <div>
                    <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-0.5">Durée</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{analyse.dureeMinutes} min</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Questions extraites */}
          {analyse.questions.length > 0 && (
            <Card className="mb-4 overflow-hidden">
              <div className="bg-[var(--color-paper-warm)] px-4 py-3 border-b border-[var(--color-rule)]">
                <p className="text-sm font-bold text-[var(--color-ink)]">
                  {analyse.questions.length} question{analyse.questions.length > 1 ? "s" : ""} extraite{analyse.questions.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-[var(--color-rule)]">
                {analyse.questions.slice(0, 5).map((q) => (
                  <div key={q.numero} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-rule)] flex items-center justify-center text-[10px] font-bold text-[var(--color-ink)]">
                        {q.numero}
                      </span>
                      <p className="text-sm text-[var(--color-ink)] line-clamp-2">{q.enonce}</p>
                    </div>
                    {q.choix && q.choix.length > 0 && (
                      <div className="mt-1.5 ml-7 flex flex-wrap gap-1">
                        {q.choix.map((c, ci) => (
                          <span key={ci} className="text-xs text-[var(--color-ink-soft)] border border-[var(--color-rule)] rounded px-1.5 py-0.5">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {analyse.questions.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      + {analyse.questions.length - 5} autre{analyse.questions.length - 5 > 1 ? "s" : ""} question{analyse.questions.length - 5 > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Button
            onClick={() => setEtape("difficulte")}
            disabled={analyse.matiere === "INCONNUE" && !matiereManuelle}
            size="lg"
            className="w-full"
          >
            Continuer →
          </Button>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE : DIFFICULTÉ ── */
  if (etape === "difficulte" && analyse) {
    const typeConfig = TYPE_CONFIG[analyse.typeExercice] ?? TYPE_CONFIG.AUTRE;
    return (
      <div className="min-h-screen bg-[var(--color-paper)]">
        <div className="mx-auto max-w-lg px-4 py-10">
          <button
            onClick={() => setEtape("preview")}
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Retour
          </button>

          <h1 className="text-xl font-black text-[var(--color-ink)] mb-2">
            Quel niveau de difficulté ?
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            L'exercice gardera les mêmes questions, mais la correction sera adaptée à ton niveau.
          </p>

          {erreur && (
            <Card className="mb-4 p-4 border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]">
              <p className="text-sm text-[var(--color-accent)] font-medium">⚠️ {erreur}</p>
              <button
                onClick={() => setErreur(null)}
                className="mt-2 text-xs text-[var(--color-ink-soft)] underline"
              >
                Réessayer
              </button>
            </Card>
          )}

          <Card className="p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{typeConfig.emoji}</span>
              <div>
                <p className="text-xs text-[var(--color-ink-soft)]">{typeConfig.label}</p>
                <p className="font-bold text-sm text-[var(--color-ink)]">{analyse.titre || "Exercice importé"}</p>
              </div>
            </div>
            <div className="space-y-2">
              {DIFFICULTES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulte(d.value)}
                  className="w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all"
                  style={{
                    borderColor: difficulte === d.value ? d.color : "var(--color-rule)",
                    background: difficulte === d.value ? `color-mix(in srgb, ${d.color} 6%, transparent)` : "transparent",
                  }}
                >
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: difficulte === d.value ? d.color : "var(--color-ink)" }}>
                      {d.label}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">{d.desc}</p>
                  </div>
                  {difficulte === d.value && (
                    <span className="text-sm font-bold" style={{ color: d.color }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          <Button onClick={handleGenerer} size="lg" className="w-full">
            Générer l'exercice ✨
          </Button>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE : GÉNÉRATION ── */
  if (etape === "generation") {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center space-y-6 px-4 max-w-sm">
          <GenerationEnCours />
        </div>
      </div>
    );
  }

  return null;
}

/* ══════════════════════════════════════════════════════════════
   COMPOSANTS AUXILIAIRES
══════════════════════════════════════════════════════════════ */

function jouerSonNotification() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch { /* AudioContext non disponible */ }
}

const MESSAGES_IMPORT = [
  { emoji: "📖", texte: "Nous lisons l'exercice extrait…" },
  { emoji: "🔬", texte: "Nous identifions les notions et compétences…" },
  { emoji: "✏️", texte: "Nous reformatons les questions pour la plateforme…" },
  { emoji: "🎯", texte: "Nous préparons la correction automatique…" },
  { emoji: "✨", texte: "Ton exercice est presque prêt…" },
];

function GenerationEnCours() {
  const [msgIndex, setMsgIndex] = useState(0);

  useState(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES_IMPORT.length), 3500);
    return () => clearInterval(t);
  });

  const { emoji, texte } = MESSAGES_IMPORT[msgIndex];
  const rayon = 52;
  const circonf = 2 * Math.PI * rayon;

  return (
    <>
      <div className="relative mx-auto" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={rayon} fill="none" stroke="var(--color-rule)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={rayon}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circonf}
            strokeDashoffset={circonf * 0.25}
            transform="rotate(-90 60 60)"
            style={{ animation: "spin 2s linear infinite" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl" key={msgIndex}
          style={{ animation: "fadeIn 0.4s ease" }}>
          {emoji}
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xl font-black text-[var(--color-ink)]">Génération en cours…</p>
        <p className="text-sm text-[var(--color-ink-soft)] min-h-[1.25rem]" key={msgIndex}
          style={{ animation: "fadeIn 0.4s ease" }}>
          {texte}
        </p>
      </div>

      <p className="text-xs text-[var(--color-ink-soft)]">⏱ Cela prend généralement moins de 30 secondes</p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}

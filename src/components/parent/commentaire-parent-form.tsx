"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

type TypeCommentaire =
  | "OBSERVATION_PARENT"
  | "COMMENTAIRE_ENSEIGNANT"
  | "PLAN_INTERVENTION"
  | "RAPPORT_BILAN"
  | "AUTRE";

const TYPES: { value: TypeCommentaire; emoji: string; label: string; description: string }[] = [
  {
    value: "OBSERVATION_PARENT",
    emoji: "👨‍👩‍👧",
    label: "Observation du parent",
    description: "Comportement à la maison, progrès notés, difficultés observées…",
  },
  {
    value: "COMMENTAIRE_ENSEIGNANT",
    emoji: "🍎",
    label: "Note de l'enseignant",
    description: "Retour verbal ou écrit de l'enseignant(e) sur les devoirs, comportement, résultats…",
  },
  {
    value: "PLAN_INTERVENTION",
    emoji: "📋",
    label: "Plan d'intervention (PIE)",
    description: "Téléversez le PIE ou collez son contenu ici.",
  },
  {
    value: "RAPPORT_BILAN",
    emoji: "📊",
    label: "Rapport / Bilan",
    description: "Bulletin, rapport d'évaluation, bilan d'orthopédagogue…",
  },
  {
    value: "AUTRE",
    emoji: "📝",
    label: "Autre note",
    description: "Toute autre information pertinente pour l'accompagnement.",
  },
];

type Phase = "formulaire" | "succes" | "regeneration" | "termine";

interface Props {
  eleveId: string;
  prenomEnfant: string;
  onSuccess?: () => void;
}

export function CommentaireParentForm({ eleveId, prenomEnfant, onSuccess }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [phase, setPhase] = useState<Phase>("formulaire");
  const [type, setType] = useState<TypeCommentaire>("OBSERVATION_PARENT");
  const [contenu, setContenu] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const [erreurForm, setErreurForm] = useState("");
  const [erreurRegen, setErreurRegen] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const ajouter = trpc.parent.ajouterCommentaire.useMutation({
    onSuccess: () => {
      utils.parent.listerCommentaires.invalidate({ eleveId });
      setErreurForm("");
      setPhase("succes");
      onSuccess?.();
    },
    onError: (err) => {
      setErreurForm(err.message || "Une erreur est survenue. Réessayez.");
    },
  });

  const regenererPlan = trpc.parent.genererPlanAccompagnement.useMutation({
    onSuccess: () => {
      setPhase("termine");
      // Rechargement complet pour garantir les données fraîches côté serveur
      setTimeout(() => window.location.reload(), 1200);
    },
    onError: (err) => {
      setErreurRegen(err.message || "Erreur lors de la mise à jour du plan.");
      setPhase("succes"); // Revenir à l'état succès pour que l'utilisateur puisse réessayer
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    setNomFichier(fichier.name);
    setExtractError("");
    setExtracting(true);

    try {
      const fd = new FormData();
      fd.append("fichier", fichier);
      fd.append("type", type);

      const res = await fetch("/api/extraire-document", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setExtractError(json.error ?? "Erreur lors de l'analyse.");
      } else {
        setContenu((prev) =>
          prev
            ? `${prev}\n\n--- Extrait de "${fichier.name}" ---\n${json.texte}`
            : json.texte
        );
      }
    } catch {
      setExtractError("Impossible d'analyser le fichier. Vérifiez votre connexion.");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function fermer() {
    setOuvert(false);
    setPhase("formulaire");
    setContenu("");
    setNomFichier("");
    setExtractError("");
    setErreurRegen("");
  }

  if (!ouvert) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOuvert(true)}>
        + Ajouter une note
      </Button>
    );
  }

  // ── Phase succès ──────────────────────────────────────────────────────────
  if (phase === "succes") {
    return (
      <Card className="p-6 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)]">
        <div className="flex items-start gap-3 mb-5">
          <span className="text-3xl flex-shrink-0">✅</span>
          <div>
            <p className="text-sm font-bold text-[var(--color-success)] mb-1">
              Note enregistrée avec succès !
            </p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">
              Votre note a bien été prise en compte. L'IA l'utilisera lors de la prochaine
              génération du plan pour mieux personnaliser l'accompagnement de{" "}
              <strong>{prenomEnfant}</strong>.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[var(--color-rule)] p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
            Voulez-vous mettre à jour les plans maintenant ?
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
            En régénérant maintenant, le <strong>plan d'accompagnement du parent</strong> et les
            futures recommandations pour <strong>{prenomEnfant}</strong> tiendront compte
            immédiatement de cette nouvelle information.
          </p>
        </div>

        {erreurRegen && (
          <div className="rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-3 mb-3">
            <p className="text-sm text-[var(--color-accent)]">⚠️ {erreurRegen}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">Votre note est bien enregistrée. Vous pouvez générer le plan manuellement depuis cette page.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={fermer}
          >
            Plus tard
          </Button>
          <Button
            size="sm"
            className="flex-[2]"
            loading={regenererPlan.isPending}
            onClick={() => {
              setPhase("regeneration");
              regenererPlan.mutate({ eleveId });
            }}
          >
            Mettre à jour les plans maintenant →
          </Button>
        </div>
      </Card>
    );
  }

  // ── Phase régénération en cours ───────────────────────────────────────────
  if (phase === "regeneration") {
    return (
      <Card className="p-6 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)]">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 animate-spin text-[var(--color-purple)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-bold text-[var(--color-purple)]">
              Mise à jour des plans en cours…
            </p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] text-center leading-relaxed max-w-sm">
            L'équipe d'experts IA — orthopédagogue, coach, psychoneurologue, conseiller en
            éducation et enseignant — intègre vos nouvelles informations et recalcule le plan
            d'accompagnement pour {prenomEnfant}.
          </p>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-[var(--color-purple)]"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ── Phase terminée ────────────────────────────────────────────────────────
  if (phase === "termine") {
    return (
      <Card className="p-6 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)]">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl flex-shrink-0">🎉</span>
          <div>
            <p className="text-sm font-bold text-[var(--color-success)] mb-1">
              Plans mis à jour avec succès !
            </p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">
              Le plan d'accompagnement a été régénéré en tenant compte de votre note.
              Faites défiler la page pour voir le plan mis à jour.
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="w-full" onClick={fermer}>
          Fermer
        </Button>
      </Card>
    );
  }

  // ── Phase formulaire ──────────────────────────────────────────────────────
  return (
    <Card className="p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.02)]">
      <p className="text-sm font-bold text-[var(--color-ink)] mb-4">
        Ajouter une note pour {prenomEnfant}
      </p>

      {/* Type de commentaire */}
      <div className="space-y-2 mb-4">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              type === t.value
                ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)] text-[var(--color-ink)]"
                : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            <span className="text-lg flex-shrink-0">{t.emoji}</span>
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{t.description}</p>
            </div>
            {type === t.value && (
              <span className="ml-auto text-[var(--color-purple)] font-bold flex-shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Zone de téléversement */}
      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors ${
            extracting
              ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)] text-[var(--color-purple)] cursor-wait"
              : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-purple)] hover:text-[var(--color-purple)]"
          }`}
        >
          {extracting ? (
            <>
              <span className="animate-spin">⏳</span>
              Analyse du document en cours…
            </>
          ) : (
            <>
              <span>📎</span>
              {nomFichier
                ? `Téléverser un autre fichier`
                : "Téléverser un document ou une photo"}
            </>
          )}
        </button>
        <p className="text-xs text-[var(--color-ink-soft)] mt-1.5 text-center">
          JPG, PNG, PDF · Max 10 Mo · Le texte sera extrait automatiquement par l'IA
        </p>
        {nomFichier && !extracting && (
          <p className="text-xs text-[var(--color-success)] mt-1 text-center">
            ✓ Texte extrait de « {nomFichier} » — vérifiez ci-dessous avant d'enregistrer
          </p>
        )}
        {extractError && (
          <p className="text-xs text-[var(--color-accent)] mt-1.5 text-center">{extractError}</p>
        )}
      </div>

      {/* Contenu textuel */}
      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        rows={6}
        placeholder={
          type === "PLAN_INTERVENTION"
            ? "Le texte extrait du PIE apparaîtra ici. Vous pouvez aussi saisir ou modifier le contenu manuellement…"
            : type === "COMMENTAIRE_ENSEIGNANT"
            ? "Ex : L'enseignant a mentionné que Mathieu a du mal à se concentrer en fin de journée…"
            : "Décrivez vos observations, ce que vous avez remarqué à la maison ou ce qui vous préoccupe…"
        }
        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple)] resize-none mb-4"
      />

      {erreurForm && (
        <div className="mb-3 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-3">
          <p className="text-sm text-[var(--color-accent)] font-medium">⚠️ {erreurForm}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={fermer}
        >
          Annuler
        </Button>
        <Button
          size="sm"
          className="flex-[2]"
          loading={ajouter.isPending}
          disabled={!contenu.trim() || extracting}
          onClick={() => {
            setErreurForm("");
            ajouter.mutate({ eleveId, type, contenu });
          }}
        >
          {ajouter.isPending ? "Enregistrement…" : "Enregistrer la note"}
        </Button>
      </div>
    </Card>
  );
}

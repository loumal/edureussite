"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TypeCommentaire = "DIFFICULTE" | "OBJECTIF_MAITRISE" | "QUESTION" | "AUTRE";

const MATIERES = [
  { value: "FRANCAIS",           label: "Français",        emoji: "📖" },
  { value: "MATHEMATIQUES",      label: "Maths",           emoji: "🔢" },
  { value: "SCIENCES",           label: "Sciences",        emoji: "🔬" },
  { value: "UNIVERS_SOCIAL",     label: "Univers social",  emoji: "🌍" },
  { value: "ANGLAIS",            label: "Anglais",         emoji: "🗣️" },
  { value: "ARTS",               label: "Arts",            emoji: "🎨" },
  { value: "EDUCATION_PHYSIQUE", label: "Éd. physique",    emoji: "⚽" },
  { value: "ETHIQUE",            label: "Éthique",         emoji: "🤝" },
];

const TYPES: { value: TypeCommentaire; emoji: string; label: string; placeholder: string }[] = [
  {
    value: "DIFFICULTE",
    emoji: "😓",
    label: "J'ai de la difficulté avec…",
    placeholder: "Ex : Je n'arrive pas à comprendre les fractions. Quand j'essaie de les additionner, je mélange les dénominateurs…",
  },
  {
    value: "OBJECTIF_MAITRISE",
    emoji: "🎯",
    label: "Je veux maîtriser…",
    placeholder: "Ex : Je veux vraiment comprendre les tables de multiplication. J'ai aussi envie de mieux écrire sans fautes…",
  },
  {
    value: "QUESTION",
    emoji: "🤔",
    label: "J'ai une question sur…",
    placeholder: "Ex : Pourquoi on utilise des virgules dans les grands nombres ? Je ne comprends pas la règle…",
  },
  {
    value: "AUTRE",
    emoji: "💬",
    label: "Autre chose à dire…",
    placeholder: "Ex : Les exercices de lecture sont trop longs pour moi. Je préfèrerais des textes plus courts…",
  },
];

interface Props {
  prenom: string;
}

export function CommentaireEleveWidget({ prenom }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<TypeCommentaire>("DIFFICULTE");
  const [contenu, setContenu] = useState("");
  const [matieresSelectionnees, setMatieresSelectionnees] = useState<string[]>([]);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  const utils = trpc.useUtils();

  const ajouter = trpc.eleve.ajouterCommentaireEleve.useMutation({
    onSuccess: () => {
      utils.eleve.listerCommentairesEleve.invalidate();
      setSucces(true);
      setContenu("");
      setMatieresSelectionnees([]);
      setTimeout(() => {
        setSucces(false);
        setOuvert(false);
      }, 2000);
    },
    onError: (err) => {
      setErreur(err.message || "Une erreur est survenue. Réessaie.");
    },
  });

  function toggleMatiere(matiere: string) {
    setMatieresSelectionnees((prev) =>
      prev.includes(matiere) ? prev.filter((m) => m !== matiere) : [...prev, matiere]
    );
  }

  function fermer() {
    setOuvert(false);
    setContenu("");
    setMatieresSelectionnees([]);
    setErreur("");
    setSucces(false);
  }

  const currentType = TYPES.find((t) => t.value === type)!;

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[rgba(91,79,207,0.35)] bg-[rgba(91,79,207,0.03)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-purple)] hover:bg-[rgba(91,79,207,0.06)]"
      >
        <span className="text-2xl flex-shrink-0">💬</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Parle à ton IA personnelle
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Dis-lui tes difficultés, ce que tu veux apprendre ou maîtriser…
          </p>
        </div>
        <span className="ml-auto text-[var(--color-purple)] font-bold text-lg flex-shrink-0">+</span>
      </button>
    );
  }

  if (succes) {
    return (
      <Card className="p-5 border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.05)]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <p className="text-sm font-bold text-[var(--color-success)]">Message envoyé !</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              Ton IA va prendre ça en compte pour personnaliser tes prochains exercices.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.02)]">
      <p className="text-sm font-bold text-[var(--color-ink)] mb-4">
        💬 Dis-moi ce que tu ressens, {prenom}
      </p>

      {/* Type */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
              type === t.value
                ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.08)] text-[var(--color-ink)]"
                : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            <span className="text-base flex-shrink-0">{t.emoji}</span>
            <span className="leading-tight">{t.label}</span>
            {type === t.value && (
              <span className="ml-auto text-[var(--color-purple)] font-bold flex-shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Matières (optionnel) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">
          Dans quelle(s) matière(s) ? <span className="font-normal">(facultatif)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MATIERES.map((m) => {
            const sel = matieresSelectionnees.includes(m.value);
            return (
              <button
                key={m.value}
                onClick={() => toggleMatiere(m.value)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all ${
                  sel
                    ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.1)] text-[var(--color-purple)] font-semibold"
                    : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        rows={5}
        placeholder={currentType.placeholder}
        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple)] resize-none mb-3"
      />

      {erreur && (
        <div className="mb-3 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-2">
          <p className="text-xs text-[var(--color-accent)]">⚠️ {erreur}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={fermer}>
          Annuler
        </Button>
        <Button
          size="sm"
          className="flex-[2]"
          loading={ajouter.isPending}
          disabled={!contenu.trim()}
          onClick={() => {
            setErreur("");
            ajouter.mutate({
              type,
              contenu,
              matieres: matieresSelectionnees as never[],
            });
          }}
        >
          {ajouter.isPending ? "Envoi…" : "Envoyer à mon IA →"}
        </Button>
      </div>
    </Card>
  );
}

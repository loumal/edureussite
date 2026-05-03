"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";

interface Props {
  data: OnboardingData;
  onSubmit: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

const CENTRES_INTERET = [
  { value: "SOCCER", emoji: "⚽", label: "Soccer" },
  { value: "HOCKEY", emoji: "🏒", label: "Hockey" },
  { value: "BASKETBALL", emoji: "🏀", label: "Basketball" },
  { value: "NATATION", emoji: "🏊", label: "Natation" },
  { value: "SPORT_AUTRE", emoji: "🏅", label: "Autre sport" },
  { value: "JEUX_VIDEO", emoji: "🎮", label: "Jeux vidéo" },
  { value: "MANGA_BD", emoji: "📕", label: "Manga / BD" },
  { value: "LECTURE", emoji: "📚", label: "Romans / Lecture" },
  { value: "MUSIQUE", emoji: "🎵", label: "Musique" },
  { value: "CINEMA_SERIES", emoji: "🎬", label: "Films / Séries" },
  { value: "YOUTUBE", emoji: "▶️", label: "YouTube / TikTok" },
  { value: "DESSIN", emoji: "🎨", label: "Dessin / Art" },
  { value: "CUISINE", emoji: "🍳", label: "Cuisine" },
  { value: "DANSE", emoji: "💃", label: "Danse" },
  { value: "THEATRE", emoji: "🎭", label: "Théâtre" },
  { value: "ANIMAUX", emoji: "🐾", label: "Animaux" },
  { value: "NATURE", emoji: "🌲", label: "Nature / Plein air" },
  { value: "TECHNOLOGIE", emoji: "💻", label: "Techno / Code" },
  { value: "VOYAGE", emoji: "✈️", label: "Voyage" },
  { value: "MODE", emoji: "👗", label: "Mode / Style" },
];

const PERSONNALITES = [
  { value: "CURIEUX", emoji: "🔍", label: "Curieux/se — j'aime explorer et poser des questions" },
  { value: "CREATIF", emoji: "🎨", label: "Créatif/ve — j'aime inventer et créer" },
  { value: "COMPETITEUR", emoji: "🏆", label: "Compétiteur/trice — j'aime me dépasser" },
  { value: "COOPERATIF", emoji: "🤝", label: "Coopératif/ve — j'apprends mieux avec les autres" },
  { value: "ANALYTIQUE", emoji: "🧮", label: "Analytique — j'aime comprendre en détail" },
  { value: "CALME", emoji: "🌿", label: "Calme — je préfère travailler à mon rythme" },
  { value: "SOCIABLE", emoji: "💬", label: "Sociable — j'ai besoin d'échanger pour comprendre" },
  { value: "AMBITIEUX", emoji: "🚀", label: "Ambitieux/se — je vise haut" },
];

const ENVIRONNEMENTS = [
  { value: "VILLE", emoji: "🏙️", label: "Ville (Montréal, Québec, Laval…)" },
  { value: "BANLIEUE", emoji: "🏘️", label: "Banlieue / Couronne" },
  { value: "REGION", emoji: "🌄", label: "Région / Campagne" },
];

const OBJECTIFS = [
  { value: "REUSSIR_ANNEE", emoji: "📋", label: "Passer mon année sans stress" },
  { value: "AMELIORER_NOTES", emoji: "📈", label: "Améliorer mes résultats dans certaines matières" },
  { value: "CEGEP_UNIVERSITE", emoji: "🎓", label: "Me préparer pour le CÉGEP ou l'université" },
  { value: "AIMER_APPRENDRE", emoji: "❤️", label: "Mieux aimer l'école et apprendre" },
  { value: "COMBLER_LACUNES", emoji: "🔧", label: "Combler mes lacunes dans une ou plusieurs matières" },
  { value: "SOUTIEN_PARENTS", emoji: "👪", label: "Mes parents m'ont inscrit(e) pour être aidé(e)" },
];

export function StepUnivers({ data, onSubmit, onBack, loading }: Props) {
  const [centresInteret, setCentresInteret] = useState<string[]>(data.centresInteret);
  const [sportFavori, setSportFavori] = useState(data.sportFavori);
  const [universMediatique, setUniversMediatique] = useState(data.universMediatique);
  const [autresPassions, setAutresPassions] = useState(data.autresPassions);
  const [environnement, setEnvironnement] = useState(data.environnement);
  const [personnalite, setPersonnalite] = useState<string[]>(data.personnalite);
  const [objectifScolaire, setObjectifScolaire] = useState(data.objectifScolaire);

  const toggleInteret = (v: string) =>
    setCentresInteret((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const togglePersonnalite = (v: string) =>
    setPersonnalite((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="text-2xl font-bold text-[var(--color-ink)] mb-1">
          🌍 Ton univers personnel
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Ces infos permettent à l'IA de créer des exercices dans <strong>ton monde</strong> —
          des maths avec tes équipes, du français avec tes références. Plus tu en dis, mieux
          c'est personnalisé !
        </p>
      </div>

      <div className="space-y-7">

        {/* Centres d'intérêt */}
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">
            ❤️ Qu'est-ce que tu aimes faire ? <span className="text-[var(--color-ink-soft)] font-normal">(choisis tout ce qui s'applique)</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {CENTRES_INTERET.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleInteret(c.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  centresInteret.includes(c.value)
                    ? "bg-[var(--color-accent)] text-white scale-105"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-ink)]"
                }`}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sport favori si sport sélectionné */}
        {(centresInteret.includes("SOCCER") ||
          centresInteret.includes("HOCKEY") ||
          centresInteret.includes("BASKETBALL") ||
          centresInteret.includes("NATATION") ||
          centresInteret.includes("SPORT_AUTRE")) && (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
              🏅 Ton sport ou ton équipe favori(e) <span className="text-[var(--color-ink-soft)] font-normal">(facultatif)</span>
            </label>
            <input
              type="text"
              value={sportFavori}
              onChange={(e) => setSportFavori(e.target.value)}
              placeholder="Ex : Le Canadien de Montréal, le CF Montréal, Connor McDavid…"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
            />
          </div>
        )}

        {/* Univers médiatique */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
            🎬 Tes références culturelles <span className="text-[var(--color-ink-soft)] font-normal">(séries, films, mangas, jeux, artistes…)</span>
          </label>
          <input
            type="text"
            value={universMediatique}
            onChange={(e) => setUniversMediatique(e.target.value)}
            placeholder="Ex : Naruto, Minecraft, Taylor Swift, Marvel, Squid Game, Roblox…"
            className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
          />
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            L'IA utilisera ces références pour créer des textes et problèmes qui te parlent vraiment.
          </p>
        </div>

        {/* Autres passions */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
            ✨ Autre chose à savoir sur toi ? <span className="text-[var(--color-ink-soft)] font-normal">(facultatif)</span>
          </label>
          <input
            type="text"
            value={autresPassions}
            onChange={(e) => setAutresPassions(e.target.value)}
            placeholder="Ex : Je veux devenir vétérinaire, j'habite près d'une ferme, j'adore le rap québécois…"
            className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
          />
        </div>

        {/* Environnement */}
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
            🏡 Tu habites où ?
          </p>
          <div className="flex flex-wrap gap-2">
            {ENVIRONNEMENTS.map((e) => (
              <button
                key={e.value}
                onClick={() => setEnvironnement(e.value)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                  environnement === e.value
                    ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)] text-[var(--color-purple)]"
                    : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Personnalité */}
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
            🧠 Comment tu te décrirais ? <span className="text-[var(--color-ink-soft)] font-normal">(un ou plusieurs)</span>
          </p>
          <div className="space-y-2">
            {PERSONNALITES.map((p) => (
              <button
                key={p.value}
                onClick={() => togglePersonnalite(p.value)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                  personnalite.includes(p.value)
                    ? "border-[var(--color-success)] bg-[rgba(42,124,111,0.06)] text-[var(--color-ink)]"
                    : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="text-lg flex-shrink-0">{p.emoji}</span>
                <span className="font-medium">{p.label}</span>
                {personnalite.includes(p.value) && (
                  <span className="ml-auto text-[var(--color-success)] font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Objectif scolaire */}
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
            🎯 Pourquoi tu utilises Édu-Réussite ?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OBJECTIFS.map((o) => (
              <button
                key={o.value}
                onClick={() => setObjectifScolaire(o.value)}
                className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all ${
                  objectifScolaire === o.value
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                    : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="text-lg">{o.emoji}</span>
                <span className="font-medium leading-snug">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          ← Retour
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              centresInteret,
              sportFavori,
              universMediatique,
              autresPassions,
              environnement,
              personnalite,
              objectifScolaire,
            })
          }
          loading={loading}
          className="flex-[2]"
        >
          Créer mon profil 🚀
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    emoji: "⭐",
    titre: "Les XP — Points d'expérience",
    couleur: "rgba(201,149,42,0.08)",
    bordure: "rgba(201,149,42,0.25)",
    texte: (
      <p className="text-sm text-[var(--color-ink)] leading-relaxed">
        Tu gagnes des <strong>XP</strong> (points d&apos;expérience) à chaque exercice complété.
        Plus ton score est élevé, plus tu gagnes de XP !
        <br /><br />
        <strong>Score parfait (100 %) → ×2 XP 🏆</strong><br />
        <strong>Excellent (90–99 %) → ×1.5 XP 🌟</strong><br />
        Score normal → ×1 XP
      </p>
    ),
  },
  {
    emoji: "🗺️",
    titre: "Les niveaux — Qui es-tu ?",
    couleur: "rgba(91,79,207,0.06)",
    bordure: "rgba(91,79,207,0.2)",
    texte: (
      <div className="space-y-1.5">
        {[
          { n: 1, nom: "Apprenti",    emoji: "🌱", desc: "Tu fais tes premiers pas !",          xp: "0–499 XP" },
          { n: 2, nom: "Explorateur", emoji: "🗺️", desc: "Tu découvres de nouvelles notions !",  xp: "500–999 XP" },
          { n: 3, nom: "Chercheur",   emoji: "🔍", desc: "Tu poses les bonnes questions !",      xp: "1 000–1 499 XP" },
          { n: 4, nom: "Érudit",      emoji: "📚", desc: "Tu maîtrises beaucoup de choses !",    xp: "1 500–1 999 XP" },
          { n: 5, nom: "Expert",      emoji: "⭐", desc: "Tu pourrais aider les autres !",       xp: "2 000–2 499 XP" },
          { n: 6, nom: "Champion",    emoji: "🏆", desc: "Tu es parmi les meilleurs !",          xp: "2 500–2 999 XP" },
          { n: 7, nom: "Maître",      emoji: "🎓", desc: "Presque rien ne te résiste !",         xp: "3 000–3 499 XP" },
          { n: 8, nom: "Légende",     emoji: "🌟", desc: "Tu as tout maîtrisé !",                xp: "3 500+ XP" },
        ].map((lvl) => (
          <div key={lvl.n} className="flex items-center gap-2 text-sm">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-warm)] text-xs font-bold text-[var(--color-ink-soft)]">
              {lvl.n}
            </span>
            <span className="text-base">{lvl.emoji}</span>
            <span className="font-bold text-[var(--color-ink)]">{lvl.nom}</span>
            <span className="text-[var(--color-ink-soft)]">— {lvl.desc}</span>
            <span className="ml-auto text-[10px] font-mono text-[var(--color-ink-soft)] flex-shrink-0">{lvl.xp}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: "🔥",
    titre: "La série — Ta flamme quotidienne",
    couleur: "rgba(217,79,43,0.06)",
    bordure: "rgba(217,79,43,0.2)",
    texte: (
      <div>
        <p className="text-sm text-[var(--color-ink)] mb-3 leading-relaxed">
          Ta <strong>série</strong>, c&apos;est le nombre de jours de suite où tu fais au moins un exercice.
          Ne la laisse pas tomber ! Plus elle est longue, plus tu gagneras des récompenses.
        </p>
        <div className="space-y-2">
          {[
            { emoji: "🌱", jours: "1 jour",   reward: "C'est parti ! Bravo d'avoir commencé." },
            { emoji: "⚡", jours: "3 jours",  reward: "La flamme commence à s'allumer !" },
            { emoji: "🔥", jours: "7 jours",  reward: "Tu gagnes un bouclier 🛡️ qui protège ta série !" },
            { emoji: "💎", jours: "30 jours", reward: "Statut légendaire — tu es inarrêtable !" },
          ].map((j) => (
            <div key={j.jours} className="flex items-start gap-2 text-sm">
              <span className="text-xl leading-none flex-shrink-0">{j.emoji}</span>
              <div>
                <span className="font-bold text-[var(--color-ink)]">{j.jours} : </span>
                <span className="text-[var(--color-ink-soft)]">{j.reward}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
          <span className="text-base">🛡️</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Le bouclier</strong>, c&apos;est magique : si tu rates un jour, il se sacrifie pour sauver ta série ! Tu le gagnes tous les 7 jours.
          </p>
        </div>
      </div>
    ),
  },
  {
    emoji: "🏅",
    titre: "Les badges — Tes trophées",
    couleur: "rgba(42,124,111,0.06)",
    bordure: "rgba(42,124,111,0.2)",
    texte: (
      <p className="text-sm text-[var(--color-ink)] leading-relaxed">
        Les <strong>badges</strong> sont des récompenses spéciales que tu débloque en accomplissant des actions :
        compléter ton premier exercice parfait, maintenir une longue série, finir toutes les missions de la semaine, et bien d&apos;autres surprises…
        <br /><br />
        Les badges avec <strong>❓</strong> sont encore secrets — à toi de les découvrir !
      </p>
    ),
  },
  {
    emoji: "📋",
    titre: "Les missions — Tes défis de la semaine",
    couleur: "rgba(91,79,207,0.06)",
    bordure: "rgba(91,79,207,0.15)",
    texte: (
      <p className="text-sm text-[var(--color-ink)] leading-relaxed">
        Chaque semaine, tu reçois <strong>3 missions</strong> spéciales.
        Accomplis-les pour gagner des <strong>XP bonus</strong> (entre 100 et 200 XP par mission !).
        Les missions se renouvellent chaque lundi.
      </p>
    ),
  },
];

export function GamificationGuide() {
  const [ouvert, setOuvert] = useState(false);
  const [sectionOuverte, setSectionOuverte] = useState<number | null>(null);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOuvert((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--color-paper-warm)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎮</span>
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">Comment fonctionne Édu-Réussite ?</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Comprends les XP, niveaux, séries et badges</p>
          </div>
        </div>
        <span className="text-[var(--color-ink-soft)] text-lg transition-transform duration-200" style={{ display: "inline-block", transform: ouvert ? "rotate(90deg)" : "rotate(0deg)" }}>
          ▸
        </span>
      </button>

      {ouvert && (
        <div className="border-t border-[var(--color-rule)] p-5 space-y-3">
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: s.bordure, backgroundColor: s.couleur }}
            >
              <button
                onClick={() => setSectionOuverte(sectionOuverte === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm font-bold text-[var(--color-ink)]">{s.titre}</span>
                </div>
                <span className="text-[var(--color-ink-soft)] text-sm transition-transform duration-200" style={{ display: "inline-block", transform: sectionOuverte === i ? "rotate(90deg)" : "rotate(0deg)" }}>
                  ▸
                </span>
              </button>
              {sectionOuverte === i && (
                <div className="px-4 pb-4">
                  {s.texte}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { applyTheme, getSavedTheme } from "./theme-provider";

const THEMES = [
  {
    id: "classique",
    label: "Classique",
    emoji: "🏺",
    desc: "Sable & terracotta",
    preview: { bg: "#f5f0e8", accent: "#d94f2b", ink: "#0f1623" },
  },
  {
    id: "ocean",
    label: "Océan",
    emoji: "🌊",
    desc: "Bleu & marine",
    preview: { bg: "#edf4fb", accent: "#1a6fb5", ink: "#0d2137" },
  },
  {
    id: "foret",
    label: "Forêt",
    emoji: "🌿",
    desc: "Vert & nature",
    preview: { bg: "#eef5ee", accent: "#3d8b37", ink: "#0f2210" },
  },
  {
    id: "nuit",
    label: "Nuit",
    emoji: "🌙",
    desc: "Mode sombre",
    preview: { bg: "#161b27", accent: "#e06c3a", ink: "#e8eaf0" },
  },
];

export function ThemeSelector() {
  const [current, setCurrent] = useState("classique");

  useEffect(() => {
    setCurrent(getSavedTheme());
  }, []);

  const handleSelect = (id: string) => {
    setCurrent(id);
    applyTheme(id);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">
        🎨 Thème de couleur
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
              current === t.id
                ? "border-[var(--color-accent)] shadow-[var(--shadow-elevated)]"
                : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            {/* Aperçu miniature */}
            <div
              className="h-10 w-full rounded-xl overflow-hidden flex items-center justify-center gap-1"
              style={{ background: t.preview.bg }}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ background: t.preview.accent }}
              />
              <span
                className="h-3 w-8 rounded"
                style={{ background: t.preview.ink, opacity: 0.4 }}
              />
            </div>
            <span className="text-lg leading-none">{t.emoji}</span>
            <span className="text-xs font-bold text-[var(--color-ink)] leading-tight">
              {t.label}
            </span>
            <span className="text-[10px] text-[var(--color-ink-soft)]">
              {t.desc}
            </span>
            {current === t.id && (
              <span className="absolute top-2 right-2 text-[var(--color-accent)] text-xs font-black">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

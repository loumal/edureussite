"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils/cn";

type TtsProvider = "ELEVENLABS" | "OPENAI" | "EDUREUSSITE_RUNPOD" | "EDGE_GRATUIT";

const PROVIDERS = [
  {
    id: "ELEVENLABS" as const,
    label: "ElevenLabs",
    emoji: "🔊",
    cout: "TTS $0,30/1000 chars",
    detail: "Voix Mira ultra-naturelle · expressivité maximale",
  },
  {
    id: "OPENAI" as const,
    label: "OpenAI TTS",
    emoji: "⚡",
    cout: "TTS $0,015/1000 chars (20× moins cher)",
    detail: "Voix « nova » en français · même clé API que Claude",
  },
  {
    id: "EDUREUSSITE_RUNPOD" as const,
    label: "Edureussite RunPod",
    emoji: "🏠",
    cout: "TTS auto-hébergé · coût RunPod uniquement",
    detail: "edge-tts · fr-FR-DeniseNeural · infrastructure propriétaire",
  },
  {
    id: "EDGE_GRATUIT" as const,
    label: "Edge_gratuit",
    emoji: "🆓",
    cout: "TTS 100% gratuit · aucune clé API requise",
    detail: "DeniseNeural (FR) + JennyNeural (EN) · SSML cheerful · sur Vercel",
  },
];

export function TtsProviderSelector({ initialProvider }: { initialProvider: TtsProvider }) {
  const [selected, setSelected] = useState<TtsProvider>(initialProvider);
  const [saved, setSaved] = useState(false);

  const set = trpc.admin.setTtsProvider.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleChange(provider: TtsProvider) {
    setSelected(provider);
    set.mutate({ provider });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
          Fournisseur TTS (voix Mira)
        </p>
        {saved && (
          <span className="text-xs text-green-600 font-semibold">✓ Enregistré</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleChange(p.id)}
            disabled={set.isPending}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
              selected === p.id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
            )}
          >
            <span className="text-xl leading-none">{p.emoji}</span>
            <div>
              <p className={`text-sm font-bold ${selected === p.id ? "text-white" : "text-[var(--color-ink)]"}`}>
                {p.label}
              </p>
              <p className={`text-xs mt-0.5 ${selected === p.id ? "text-white/80" : "text-[var(--color-ink-soft)]"}`}>
                {p.cout}
              </p>
              <p className={`text-[10px] mt-0.5 ${selected === p.id ? "text-white/60" : "text-[var(--color-ink-soft)]"}`}>
                {p.detail}
              </p>
            </div>
            {selected === p.id && (
              <span className="ml-auto text-white text-sm">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

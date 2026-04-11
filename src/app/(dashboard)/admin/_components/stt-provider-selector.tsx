"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const PROVIDERS = [
  {
    id: "ELEVENLABS" as const,
    label: "ElevenLabs",
    emoji: "🎙",
    cout: "STT $0,40/h · Voix $0,30/1000 chars",
    detail: "Gère tout seul · voix Mira naturelle en français",
  },
  {
    id: "DEEPGRAM" as const,
    label: "Deepgram + ElevenLabs",
    emoji: "⚡",
    cout: "STT $0,0043/min · Voix ElevenLabs (inchangée)",
    detail: "Deepgram pour le micro · ElevenLabs pour la voix Mira",
  },
];

export function SttProviderSelector({ initialProvider }: { initialProvider: "ELEVENLABS" | "DEEPGRAM" }) {
  const [selected, setSelected] = useState<"ELEVENLABS" | "DEEPGRAM">(initialProvider);
  const [saved, setSaved] = useState(false);

  const set = trpc.admin.setSttProvider.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleChange(provider: "ELEVENLABS" | "DEEPGRAM") {
    setSelected(provider);
    set.mutate({ provider });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
          Fournisseur vocal
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
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              selected === p.id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
            }`}
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

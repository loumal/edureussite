"use client";

import { parseMiraMessage, MiraFigure } from "@/components/mira/mira-figures";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  message: Message;
  primaryColor: string;
  prenom: string;
}

export function EnseignantIaBubble({ message, primaryColor, prenom }: Props) {
  const isAssistant = message.role === "assistant";

  // Pour les messages de Mira, parser les balises [FIGURE:xxx]
  const segments = isAssistant ? parseMiraMessage(message.content) : null;
  const hasFigures = segments?.some((s) => s.type === "figure") ?? false;

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        style={isAssistant ? { borderLeftColor: primaryColor } : undefined}
        className={`${hasFigures ? "max-w-[95%]" : "max-w-[85%]"} rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isAssistant
            ? "bg-white text-[var(--color-ink)] rounded-tl-sm shadow-sm border-l-[3px]"
            : "bg-[var(--color-ink)] text-white rounded-tr-sm whitespace-pre-wrap"
        }`}
      >
        {!isAssistant && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">
            {prenom}
          </p>
        )}

        {isAssistant && segments
          ? segments.map((seg, i) =>
              seg.type === "figure"
                ? <MiraFigure key={i} type={seg.figType} />
                : <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
            )
          : message.content
        }
      </div>
    </div>
  );
}

// ── Bulle "Mira réfléchit…" (points animés) ─────────────────────────────────

export function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-soft)]"
            style={{
              animation: "dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

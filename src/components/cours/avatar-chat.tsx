"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AvatarAnime } from "./avatar-anime";

interface Props {
  /** Texte à lire à voix haute. Changer ce texte remet le bouton à l'état initial. */
  texte: string;
  /** Langue TTS (défaut : français canadien ou français selon dispo) */
  lang?: string;
  /** Taille de l'avatar en px */
  taille?: number;
}

export function AvatarChat({ texte, lang = "fr-CA", taille = 88 }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Vérifie la disponibilité de l'API
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
  }, []);

  // Stoppe la lecture quand le texte change (nouvelle section)
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte]);

  // Nettoyage à l'unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (!supported) return;

    if (isSpeaking) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(texte);

    // Choisit la voix française la plus naturelle disponible
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === lang || v.lang.startsWith("fr")
    );
    if (preferred) utter.voice = preferred;

    utter.lang = lang;
    utter.rate = 0.92;
    utter.pitch = 1.05;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [isSpeaking, texte, lang, supported, stop]);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Avatar animé */}
      <div className="relative flex-shrink-0">
        <AvatarAnime isSpeaking={isSpeaking} taille={taille} />
      </div>

      {/* Bouton lire / arrêter */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={toggle}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            isSpeaking
              ? "bg-[var(--color-purple)] text-white shadow-lg scale-[1.03]"
              : "bg-white border border-[rgba(91,79,207,0.3)] text-[var(--color-purple)] hover:bg-[rgba(91,79,207,0.07)]"
          }`}
          aria-label={isSpeaking ? "Arrêter la lecture" : "Lire à voix haute"}
        >
          {isSpeaking ? (
            <>
              {/* Barres audio animées */}
              <span className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="speak-bar inline-block w-0.5 rounded-full bg-white"
                    style={{ height: "16px" }}
                  />
                ))}
              </span>
              Arrêter
            </>
          ) : (
            <>
              <span className="text-base">🔊</span>
              Écouter
            </>
          )}
        </button>

        {isSpeaking && (
          <p className="text-[10px] text-[var(--color-ink-soft)] pl-1">
            Mira lit pour toi…
          </p>
        )}
      </div>
    </div>
  );
}

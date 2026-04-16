"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-paper)]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">
          Quelque chose s'est mal passé
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mb-6">
          Une erreur inattendue s'est produite. L'équipe a été notifiée.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs opacity-60">
              Code : {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            ← Accueil
          </Button>
          <Button onClick={unstable_retry}>
            Réessayer
          </Button>
        </div>
      </div>
    </div>
  );
}

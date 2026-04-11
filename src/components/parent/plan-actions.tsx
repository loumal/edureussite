"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

interface Props {
  eleveId: string;
  prenomEnfant: string;
}

export function PlanActions({ eleveId, prenomEnfant }: Props) {
  const [lien, setLien] = useState("");
  const [copie, setCopie] = useState(false);

  const getOuCreerLien = trpc.parent.getOuCreerLienPartage.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        const url = `${window.location.origin}/partager/${data.token}`;
        setLien(url);
        // Copie automatique dans le presse-papiers
        navigator.clipboard.writeText(url).then(() => {
          setCopie(true);
          setTimeout(() => setCopie(false), 3000);
        });
      }
    },
  });

  function imprimer() {
    window.print();
  }

  return (
    <div className="flex gap-2 flex-wrap print:hidden">
      {/* Imprimer / PDF */}
      <Button
        variant="secondary"
        size="sm"
        onClick={imprimer}
      >
        🖨️ Imprimer / PDF
      </Button>

      {/* Partager */}
      {!lien ? (
        <Button
          variant="secondary"
          size="sm"
          loading={getOuCreerLien.isPending}
          onClick={() => getOuCreerLien.mutate({ eleveId })}
        >
          🔗 Partager le plan
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={lien}
            className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] w-56 truncate"
          />
          <Button
            variant={copie ? "success" : "secondary"}
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(lien).then(() => {
                setCopie(true);
                setTimeout(() => setCopie(false), 3000);
              });
            }}
          >
            {copie ? "✓ Copié !" : "Copier"}
          </Button>
        </div>
      )}
    </div>
  );
}

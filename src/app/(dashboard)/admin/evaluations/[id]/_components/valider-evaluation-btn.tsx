"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  evaluationId: string;
}

export function ValiderEvaluationBtn({ evaluationId }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<{ tokenAcces?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valider = trpc.admin.validerEvaluation.useMutation({
    onSuccess: (data) => {
      setResult(data);
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (result) {
    if (result.tokenAcces) {
      return (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <p className="text-sm font-bold text-emerald-800 mb-2">✅ Évaluation approuvée</p>
          <p className="text-xs text-emerald-700 mb-3">
            Le formulaire a été créé et un email a été envoyé au parent avec le lien d'accès.
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] font-mono bg-white border border-[var(--color-rule)] rounded-lg px-3 py-2 break-all">
            Token: {result.tokenAcces}
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl bg-gray-100 border border-gray-200 p-5">
        <p className="text-sm font-bold text-gray-700">Évaluation rejetée.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => valider.mutate({ evaluationId, action: "REJECT" })}
          disabled={valider.isPending}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-[var(--color-rule)] bg-white text-[var(--color-ink)] text-sm font-semibold hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          🚫 Rejeter
        </button>
        <button
          onClick={() => valider.mutate({ evaluationId, action: "APPROVE" })}
          disabled={valider.isPending}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {valider.isPending ? "Traitement…" : "✅ Approuver et envoyer"}
        </button>
      </div>
      <p className="text-xs text-[var(--color-ink-soft)] text-center">
        Approuver créera le formulaire et enverra le lien par email au parent.
      </p>
    </div>
  );
}

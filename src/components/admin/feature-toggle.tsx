"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  featureKey: string;
  actif: boolean;
  label: string;
}

export function FeatureToggle({ featureKey, actif, label }: Props) {
  const router = useRouter();

  const toggle = trpc.admin.toggleFeature.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--color-ink-soft)]">{label}</span>
      <button
        onClick={() => toggle.mutate({ cle: featureKey, actif: !actif })}
        disabled={toggle.isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          actif ? "bg-[var(--color-success)]" : "bg-[var(--color-rule)]"
        }`}
        title={actif ? "Désactiver cette fonctionnalité" : "Activer cette fonctionnalité"}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            actif ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-xs font-semibold ${actif ? "text-[var(--color-success)]" : "text-[var(--color-ink-soft)]"}`}>
        {actif ? "Activé" : "Désactivé"}
      </span>
    </div>
  );
}

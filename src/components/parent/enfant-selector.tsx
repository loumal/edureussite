"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Enfant {
  id: string;
  prenom: string;
  nom: string;
}

interface Props {
  enfants: Enfant[];
  enfantActifId: string;
  basePath?: string;
}

export function EnfantSelector({ enfants, enfantActifId, basePath = "/parent" }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const select = (id: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("enfant", id);
    router.push(`${basePath}?${sp.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {enfants.map((e) => {
        const actif = e.id === enfantActifId;
        return (
          <button
            key={e.id}
            onClick={() => select(e.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              actif
                ? "bg-[var(--color-ink)] text-white shadow-sm"
                : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-black">
              {e.prenom.charAt(0)}
            </span>
            {e.prenom}
          </button>
        );
      })}
    </div>
  );
}

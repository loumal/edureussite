"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  valide: boolean;
}

export function ValiderEpreuveBtn({ id, valide }: Props) {
  const router = useRouter();

  const valider = trpc.admin.validerEpreuve.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      variant={valide ? "secondary" : "primary"}
      size="sm"
      onClick={() => valider.mutate({ id, valide: !valide })}
      disabled={valider.isPending}
    >
      {valide ? "Retirer la validation" : "✓ Valider"}
    </Button>
  );
}

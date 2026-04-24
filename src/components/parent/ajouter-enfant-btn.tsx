"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { AjouterEnfantModal } from "./ajouter-enfant-modal";

interface Props {
  variant?: "primary" | "secondary";
}

export function AjouterEnfantBtn({ variant = "secondary" }: Props) {
  const [open, setOpen] = useState(false);
  const { data: flags } = trpc.auth.getPublicFeatureFlags.useQuery();

  return (
    <>
      <Button
        variant={variant === "primary" ? "primary" : "secondary"}
        onClick={() => setOpen(true)}
        size={variant === "primary" ? "lg" : "sm"}
      >
        + Ajouter un enfant
      </Button>

      {open && (
        <AjouterEnfantModal
          onClose={() => setOpen(false)}
          multiProvince={flags?.multiProvince ?? false}
          provincesActives={flags?.provincesActives ?? { QC: true }}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AjouterEnfantModal } from "./ajouter-enfant-modal";

interface Props {
  variant?: "primary" | "secondary";
}

export function AjouterEnfantBtn({ variant = "secondary" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant === "primary" ? "primary" : "secondary"}
        onClick={() => setOpen(true)}
        size={variant === "primary" ? "lg" : "sm"}
      >
        + Ajouter un enfant
      </Button>

      {open && <AjouterEnfantModal onClose={() => setOpen(false)} />}
    </>
  );
}

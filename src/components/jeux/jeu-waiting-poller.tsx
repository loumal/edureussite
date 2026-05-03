"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export function JeuWaitingPoller({ demandeId, jeuId }: { demandeId: string; jeuId: string }) {
  const router = useRouter();
  const { data } = trpc.eleve.getStatutDemande.useQuery(
    { demandeId },
    { refetchInterval: 5000 }
  );

  useEffect(() => {
    if (!data) return;
    if (data.statut === "AUTORISE") {
      router.push(`/eleve/jeux/${data.jeuId}?demandeId=${demandeId}`);
    } else if (data.statut === "REFUSE" || data.statut === "EXPIRE") {
      router.refresh();
    }
  }, [data, demandeId, jeuId, router]);

  return null;
}

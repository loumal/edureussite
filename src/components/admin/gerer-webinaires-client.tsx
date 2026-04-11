"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Webinaire {
  id: string;
  titre: string;
  dateHeure: Date;
  gratuit: boolean;
  actif: boolean;
  inscriptions: { id: string }[];
  maxParticipants?: number | null;
}

interface Props {
  specialisteId: string;
  webinaires: Webinaire[];
}

export function GererWebinairesClient({ specialisteId, webinaires }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateHeure, setDateHeure] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState(60);
  const [lienInscription, setLienInscription] = useState("");
  const [gratuit, setGratuit] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState("");

  const ajouter = trpc.specialiste.ajouterWebinaire.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitre(""); setDescription(""); setDateHeure("");
      setLienInscription(""); setMaxParticipants("");
      router.refresh();
    },
  });

  const supprimer = trpc.specialiste.supprimerWebinaire.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div>
      {/* Liste des webinaires */}
      {webinaires.length > 0 && (
        <div className="mt-3 space-y-2">
          {webinaires.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-paper-warm)] px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--color-ink)] line-clamp-1">{w.titre}</p>
                <p className="text-[11px] text-[var(--color-ink-soft)]">
                  {new Date(w.dateHeure).toLocaleDateString("fr-CA", { dateStyle: "short" })} ·{" "}
                  {new Date(w.dateHeure).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {w.inscriptions.length} inscrit{w.inscriptions.length !== 1 ? "s" : ""}
                  {w.maxParticipants ? `/${w.maxParticipants}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={w.gratuit ? "success" : "gold"}>
                  {w.gratuit ? "Gratuit" : "Payant"}
                </Badge>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer "${w.titre}" ?`)) {
                      supprimer.mutate({ id: w.id });
                    }
                  }}
                  disabled={supprimer.isPending}
                  className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-40"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton / formulaire ajout */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 text-xs font-semibold text-[var(--color-accent)] hover:underline"
        >
          + Ajouter un webinaire
        </button>
      ) : (
        <div className="mt-3 rounded-xl border border-[var(--color-rule)] bg-white p-4 space-y-3">
          <p className="text-xs font-bold text-[var(--color-ink)]">Nouveau webinaire</p>

          <div>
            <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Titre *</label>
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre du webinaire"
              className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs resize-none focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Date et heure *</label>
              <input
                type="datetime-local"
                value={dateHeure}
                onChange={(e) => setDateHeure(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Durée (min)</label>
              <input
                type="number"
                value={dureeMinutes}
                onChange={(e) => setDureeMinutes(Number(e.target.value))}
                min={15}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Lien inscription</label>
              <input
                type="url"
                value={lienInscription}
                onChange={(e) => setLienInscription(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Max participants</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Illimité"
                min={1}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`gratuit-${specialisteId}`}
              checked={gratuit}
              onChange={(e) => setGratuit(e.target.checked)}
              className="rounded"
            />
            <label htmlFor={`gratuit-${specialisteId}`} className="text-xs text-[var(--color-ink)]">
              Webinaire gratuit
            </label>
          </div>

          {ajouter.isError && (
            <p className="text-xs text-[var(--color-accent)]">{ajouter.error.message}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className="flex-1 text-xs"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!titre || !dateHeure) return;
                ajouter.mutate({
                  specialisteId,
                  titre,
                  description: description || undefined,
                  dateHeure: new Date(dateHeure).toISOString(),
                  dureeMinutes,
                  lienInscription: lienInscription || undefined,
                  gratuit,
                  maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
                });
              }}
              disabled={!titre || !dateHeure || ajouter.isPending}
              className="flex-[2] text-xs"
            >
              {ajouter.isPending ? "Création…" : "Créer le webinaire"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

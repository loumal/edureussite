"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SPECIALITES = [
  { value: "ORTHOPEDAGOGUE", label: "Orthopédagogue" },
  { value: "PSYCHONEUROLOGUE", label: "Psychoneurologue" },
  { value: "PSYCHOEDUCATEUR", label: "Psychoéducateur" },
  { value: "ORTHOPHONISTE", label: "Orthophoniste" },
  { value: "TRAVAILLEUR_SOCIAL", label: "Travailleur social" },
  { value: "PSYCHOLOGUE", label: "Psychologue" },
  { value: "AUTRE", label: "Autre spécialité" },
] as const;

type Specialite = typeof SPECIALITES[number]["value"];

export function GererSpecialistesClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [specialite, setSpecialite] = useState<Specialite>("ORTHOPEDAGOGUE");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [photo, setPhoto] = useState("");
  const [disponibilites, setDisponibilites] = useState("");

  const creer = trpc.specialiste.creer.useMutation({
    onSuccess: () => {
      setOpen(false);
      setPrenom(""); setNom(""); setBio(""); setEmail("");
      setTelephone(""); setPhoto(""); setDisponibilites("");
      router.refresh();
    },
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        + Ajouter un spécialiste
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Nouveau spécialiste">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between border-b border-[var(--color-rule)] px-6 py-4">
            <h2 className="text-lg font-black text-[var(--color-ink)]">Nouveau spécialiste</h2>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">✕</button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Prénom *</label>
                <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Marie" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Nom *</label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Tremblay" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Spécialité *</label>
              <select
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value as Specialite)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none"
              >
                {SPECIALITES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Biographie *</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Formation, expérience, approche thérapeutique…"
                rows={4}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] resize-none focus:border-[var(--color-ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Courriel professionnel *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie.tremblay@clinique.qc.ca" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Téléphone (optionnel)</label>
              <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="514 555-0123" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Photo — URL (optionnel)</label>
              <Input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Disponibilités (optionnel)</label>
              <Input value={disponibilites} onChange={(e) => setDisponibilites(e.target.value)} placeholder="Lundi 9h-17h, Mercredi 13h-18h" />
            </div>

            {creer.isError && (
              <p className="text-xs text-[var(--color-accent)]">{creer.error.message}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={() => creer.mutate({
                  prenom, nom, specialite, bio, email,
                  telephone: telephone || undefined,
                  photo: photo || undefined,
                  disponibilites: disponibilites || undefined,
                })}
                disabled={!prenom || !nom || !bio || !email || bio.length < 10 || creer.isPending}
                className="flex-[2]"
              >
                {creer.isPending ? "Création…" : "Créer le profil"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";
import type { NiveauScolaire } from "@/generated/prisma";
import { getNiveauxParRegion, getCycleLabel } from "@/lib/education/region-education";

interface Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  province?: string;
}

export function StepIdentite({ data, onNext, province = "QC" }: Props) {
  const [prenom, setPrenom] = useState(data.prenom);
  const [nom, setNom] = useState(data.nom);
  const [niveauScolaire, setNiveauScolaire] = useState<NiveauScolaire | "">(
    data.niveauScolaire
  );
  const [ecole, setEcole] = useState(data.ecole);
  const [dateRentree, setDateRentree] = useState<string>(data.dateRentree ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const NIVEAUX = getNiveauxParRegion(province);
  const cycleLabels = getCycleLabel(province);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Texte adapté si la rentrée est dans le futur
  const rentreeFuture = dateRentree && dateRentree > today;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!prenom.trim()) errs.prenom = "Ton prénom, s'il te plaît !";
    if (!niveauScolaire) errs.niveau = "Choisis ton année scolaire";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onNext({
      prenom,
      nom,
      niveauScolaire: niveauScolaire as NiveauScolaire,
      ecole,
      dateRentree: dateRentree || undefined,
    });
  };

  const primaireNiveaux = NIVEAUX.filter(
    (n) =>
      n.cycle === cycleLabels.primaire ||
      n.cycle === "Primaire" ||
      n.cycle === "Elementary" ||
      n.cycle.startsWith("Primaire")
  );
  const secondaireNiveaux = NIVEAUX.filter((n) => !primaireNiveaux.includes(n));

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="text-2xl font-bold text-[var(--color-ink)] mb-1">
          👋 Bonjour ! Comment tu t'appelles ?
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Quelques infos pour créer ton profil
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            error={errors.prenom}
            placeholder="Ex : Emma"
            autoFocus
          />
          <Input
            label="Nom (facultatif)"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Tremblay"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
            Mon année scolaire *
          </p>
          {errors.niveau && (
            <p className="mb-2 text-xs text-[var(--color-accent)]">{errors.niveau}</p>
          )}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                {cycleLabels.primaire}
              </p>
              <div className="flex flex-wrap gap-2">
                {primaireNiveaux.map((n) => (
                  <button
                    key={n.value}
                    onClick={() => setNiveauScolaire(n.value as NiveauScolaire)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      niveauScolaire === n.value
                        ? "bg-[var(--color-ink)] text-white scale-105"
                        : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                {cycleLabels.secondaire}
              </p>
              <div className="flex flex-wrap gap-2">
                {secondaireNiveaux.map((n) => (
                  <button
                    key={n.value}
                    onClick={() => setNiveauScolaire(n.value as NiveauScolaire)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      niveauScolaire === n.value
                        ? "bg-[var(--color-ink)] text-white scale-105"
                        : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Mon école (facultatif)"
          value={ecole}
          onChange={(e) => setEcole(e.target.value)}
          placeholder="Ex : École Bois-Joli"
        />

        {/* ── Date de rentrée ─────────────────────────────────────────────── */}
        {niveauScolaire && (
          <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">
              📅 Quelle est ta date de rentrée scolaire ?
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mb-3">
              Si tu t'inscris avant la rentrée, on t'aidera à voir les notions à
              l'avance pour que tu sois prêt(e) dès le premier jour !
            </p>
            <input
              type="date"
              value={dateRentree}
              onChange={(e) => setDateRentree(e.target.value)}
              min={today}
              className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
            />
            {rentreeFuture && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <span className="text-base flex-shrink-0">🎒</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Super ! Tu te prépares à l'avance.
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    On va t'aider à explorer les notions de ta prochaine classe
                    pour que tu arrives en forme à la rentrée !
                  </p>
                </div>
              </div>
            )}
            {!dateRentree && (
              <p className="text-xs text-[var(--color-ink-soft)] mt-2 italic">
                Facultatif — tu pourras l'ajouter plus tard dans tes paramètres.
              </p>
            )}
          </div>
        )}

        <Button onClick={handleSubmit} size="lg" className="w-full mt-2">
          Continuer →
        </Button>
      </div>
    </Card>
  );
}

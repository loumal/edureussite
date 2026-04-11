"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

const PROVINCES_INFO: Record<string, { nom: string; langue: string; curriculum: string }> = {
  QC: { nom: "Québec",                        langue: "FR",    curriculum: "PFEQ" },
  ON: { nom: "Ontario",                        langue: "EN",    curriculum: "Ontario Curriculum" },
  BC: { nom: "Colombie-Britannique",           langue: "EN",    curriculum: "BC Curriculum" },
  AB: { nom: "Alberta",                        langue: "EN",    curriculum: "Alberta Program of Studies" },
  SK: { nom: "Saskatchewan",                   langue: "EN",    curriculum: "SK Curriculum" },
  MB: { nom: "Manitoba",                       langue: "EN",    curriculum: "Manitoba Curriculum" },
  NB: { nom: "Nouveau-Brunswick",              langue: "FR/EN", curriculum: "NB Curriculum (bilingue)" },
  NS: { nom: "Nouvelle-Écosse",                langue: "EN",    curriculum: "NS Curriculum" },
  PE: { nom: "Île-du-Prince-Édouard",          langue: "EN",    curriculum: "PEI Curriculum" },
  NL: { nom: "Terre-Neuve-et-Labrador",        langue: "EN",    curriculum: "NL Curriculum" },
  YT: { nom: "Yukon",                          langue: "EN",    curriculum: "Yukon Curriculum" },
  NT: { nom: "Territoires du Nord-Ouest",      langue: "EN",    curriculum: "NWT Curriculum" },
  NU: { nom: "Nunavut",                        langue: "EN",    curriculum: "Nunavut Curriculum" },
};

const PROVINCE_CODES = Object.keys(PROVINCES_INFO);

export function ProvinceManager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getProvinceFlags.useQuery();

  const setMultiProvince = trpc.admin.setMultiProvince.useMutation({
    onSuccess: () => utils.admin.getProvinceFlags.invalidate(),
  });
  const setProvinceActive = trpc.admin.setProvinceActive.useMutation({
    onSuccess: () => utils.admin.getProvinceFlags.invalidate(),
  });

  const [confirm, setConfirm] = useState(false);

  const multiProvince = data?.multiProvince ?? false;
  const provincesActives = data?.provincesActives ?? {};

  async function handleToggleMultiProvince() {
    if (!multiProvince && !confirm) {
      setConfirm(true);
      return;
    }
    await setMultiProvince.mutateAsync({ actif: !multiProvince });
    setConfirm(false);
  }

  async function handleToggleProvince(code: string, actuel: boolean) {
    await setProvinceActive.mutateAsync({
      province: code as never,
      actif: !actuel,
    });
  }

  if (isLoading) return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">🇨🇦 Expansion pan-canadienne</p>
      <p className="text-xs text-[var(--color-ink-soft)]">Chargement…</p>
    </Card>
  );

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
            🇨🇦 Expansion pan-canadienne
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            Activez les provinces pour ouvrir la plateforme aux élèves hors Québec.
            Quand désactivé, seul le Québec est accessible.
          </p>
        </div>

        {/* Master toggle */}
        <div className="flex flex-col items-end gap-2">
          {confirm && !multiProvince && (
            <p className="text-xs text-[var(--color-accent)] font-semibold max-w-xs text-right">
              Confirmez : la plateforme sera visible au Canada entier. Assurez-vous que le contenu des provinces activées est prêt.
            </p>
          )}
          <button
            onClick={handleToggleMultiProvince}
            disabled={setMultiProvince.isPending}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${
              multiProvince
                ? "bg-[var(--color-rule)] text-[var(--color-ink)] hover:bg-red-50 hover:text-red-700"
                : confirm
                ? "bg-red-600 text-white hover:opacity-90"
                : "bg-[var(--color-ink)] text-white hover:opacity-90"
            }`}
          >
            {multiProvince
              ? "Désactiver l'expansion"
              : confirm
              ? "Confirmer l'activation"
              : "Activer l'expansion"}
          </button>
          {confirm && !multiProvince && (
            <button
              onClick={() => setConfirm(false)}
              className="text-xs text-[var(--color-ink-soft)] underline"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Statut global */}
      <div className={`rounded-xl px-4 py-2.5 mb-4 text-sm font-semibold flex items-center gap-2 ${
        multiProvince
          ? "bg-[rgba(42,124,111,0.10)] text-[var(--color-success)]"
          : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
      }`}>
        <span>{multiProvince ? "🟢" : "⚪"}</span>
        {multiProvince
          ? `Expansion active — ${Object.values(provincesActives).filter(Boolean).length} province(s) activée(s)`
          : "Expansion désactivée — plateforme QC uniquement"}
      </div>

      {/* Grille des provinces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PROVINCE_CODES.map((code) => {
          const info = PROVINCES_INFO[code];
          const actif = provincesActives[code] ?? false;
          const estQC = code === "QC";

          return (
            <div
              key={code}
              className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors ${
                actif
                  ? "border-[var(--color-success)] bg-[rgba(42,124,111,0.05)]"
                  : "border-[var(--color-rule)] bg-white"
              } ${!multiProvince && !estQC ? "opacity-40" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[var(--color-ink)] font-mono bg-[var(--color-rule)] rounded px-1.5 py-0.5">
                    {code}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-ink)] truncate">
                    {info.nom}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5 truncate">
                  {info.curriculum} · {info.langue}
                </p>
              </div>

              {estQC ? (
                <span className="text-[10px] font-bold text-[var(--color-success)] flex-shrink-0">
                  Par défaut
                </span>
              ) : (
                <button
                  onClick={() => handleToggleProvince(code, actif)}
                  disabled={!multiProvince || setProvinceActive.isPending}
                  className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    actif ? "bg-[var(--color-success)]" : "bg-[var(--color-rule)]"
                  }`}
                  title={!multiProvince ? "Activez d'abord l'expansion pan-canadienne" : undefined}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      actif ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {multiProvince && (
        <p className="text-[10px] text-[var(--color-ink-soft)] mt-3">
          💡 Les utilisateurs des provinces activées voient l'interface et le contenu de leur province. Le contenu QC reste invisible aux autres provinces.
        </p>
      )}
    </Card>
  );
}

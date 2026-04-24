"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

const PROVINCES_INFO: Record<string, { nom: string; langue: string; curriculum: string; groupe: "canada" | "francophonie" }> = {
  // Canada
  QC: { nom: "Québec",                        langue: "FR",    curriculum: "PFEQ",                         groupe: "canada" },
  ON: { nom: "Ontario",                        langue: "EN",    curriculum: "Ontario Curriculum",           groupe: "canada" },
  BC: { nom: "Colombie-Britannique",           langue: "EN",    curriculum: "BC Curriculum",                groupe: "canada" },
  AB: { nom: "Alberta",                        langue: "EN",    curriculum: "Alberta Program of Studies",   groupe: "canada" },
  SK: { nom: "Saskatchewan",                   langue: "EN",    curriculum: "SK Curriculum",                groupe: "canada" },
  MB: { nom: "Manitoba",                       langue: "EN",    curriculum: "Manitoba Curriculum",          groupe: "canada" },
  NB: { nom: "Nouveau-Brunswick",              langue: "FR/EN", curriculum: "NB Curriculum (bilingue)",     groupe: "canada" },
  NS: { nom: "Nouvelle-Écosse",                langue: "EN",    curriculum: "NS Curriculum",                groupe: "canada" },
  PE: { nom: "Île-du-Prince-Édouard",          langue: "EN",    curriculum: "PEI Curriculum",               groupe: "canada" },
  NL: { nom: "Terre-Neuve-et-Labrador",        langue: "EN",    curriculum: "NL Curriculum",                groupe: "canada" },
  YT: { nom: "Yukon",                          langue: "EN",    curriculum: "Yukon Curriculum",             groupe: "canada" },
  NT: { nom: "Territoires du Nord-Ouest",      langue: "EN",    curriculum: "NWT Curriculum",               groupe: "canada" },
  NU: { nom: "Nunavut",                        langue: "EN",    curriculum: "Nunavut Curriculum",           groupe: "canada" },
  // France
  FR: { nom: "France",                         langue: "FR",    curriculum: "Programmes MEN (France)",      groupe: "francophonie" },
  // Afrique francophone
  CI: { nom: "Côte d'Ivoire",                  langue: "FR",    curriculum: "Programmes MENA",              groupe: "francophonie" },
  SN: { nom: "Sénégal",                        langue: "FR",    curriculum: "Curricula MELS Sénégal",       groupe: "francophonie" },
  CM: { nom: "Cameroun",                       langue: "FR",    curriculum: "Programmes MINEDUB/MINESEC",   groupe: "francophonie" },
  BF: { nom: "Burkina Faso",                   langue: "FR",    curriculum: "Programmes MENAPLN",           groupe: "francophonie" },
  ML: { nom: "Mali",                           langue: "FR",    curriculum: "Programmes MEALN Mali",        groupe: "francophonie" },
  BJ: { nom: "Bénin",                          langue: "FR",    curriculum: "Programmes MEMP Bénin",        groupe: "francophonie" },
  TG: { nom: "Togo",                           langue: "FR",    curriculum: "Programmes MEN Togo",          groupe: "francophonie" },
  GA: { nom: "Gabon",                          langue: "FR",    curriculum: "Programmes MEN Gabon",         groupe: "francophonie" },
  CD: { nom: "R.D. Congo",                     langue: "FR",    curriculum: "Programmes MEPSP RDC",         groupe: "francophonie" },
  CG: { nom: "Congo-Brazzaville",              langue: "FR",    curriculum: "Programmes MEPSA Congo",       groupe: "francophonie" },
  GN: { nom: "Guinée",                         langue: "FR",    curriculum: "Programmes MEPUA Guinée",      groupe: "francophonie" },
  MG: { nom: "Madagascar",                     langue: "FR",    curriculum: "Programmes MEN Madagascar",    groupe: "francophonie" },
  NE: { nom: "Niger",                          langue: "FR",    curriculum: "Programmes MEN Niger",         groupe: "francophonie" },
  TD: { nom: "Tchad",                          langue: "FR",    curriculum: "Programmes MEN Tchad",         groupe: "francophonie" },
  CF: { nom: "Rép. Centrafricaine",            langue: "FR",    curriculum: "Programmes MEN RCA",           groupe: "francophonie" },
  RW: { nom: "Rwanda",                         langue: "FR",    curriculum: "Programmes REB Rwanda",        groupe: "francophonie" },
  BI: { nom: "Burundi",                        langue: "FR",    curriculum: "Programmes MEN Burundi",       groupe: "francophonie" },
  DJ: { nom: "Djibouti",                       langue: "FR",    curriculum: "Programmes MEN Djibouti",      groupe: "francophonie" },
  KM: { nom: "Comores",                        langue: "FR",    curriculum: "Programmes MEN Comores",       groupe: "francophonie" },
};

const CANADA_CODES      = Object.keys(PROVINCES_INFO).filter(c => PROVINCES_INFO[c].groupe === "canada");
const FRANCOPHONIE_CODES = Object.keys(PROVINCES_INFO).filter(c => PROVINCES_INFO[c].groupe === "francophonie");

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

  const totalActifs = Object.values(provincesActives).filter(Boolean).length;

  function RegionCard({ code }: { code: string }) {
    const info = PROVINCES_INFO[code];
    const actif = provincesActives[code] ?? false;
    const estQC = code === "QC";
    return (
      <div className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors ${
        actif ? "border-[var(--color-success)] bg-[rgba(42,124,111,0.05)]" : "border-[var(--color-rule)] bg-white"
      } ${!multiProvince && !estQC ? "opacity-40" : ""}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[var(--color-ink)] font-mono bg-[var(--color-rule)] rounded px-1.5 py-0.5">{code}</span>
            <span className="text-xs font-semibold text-[var(--color-ink)] truncate">{info.nom}</span>
          </div>
          <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5 truncate">{info.curriculum} · {info.langue}</p>
        </div>
        {estQC ? (
          <span className="text-[10px] font-bold text-[var(--color-success)] flex-shrink-0">Par défaut</span>
        ) : (
          <button
            onClick={() => handleToggleProvince(code, actif)}
            disabled={!multiProvince || setProvinceActive.isPending}
            className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              actif ? "bg-[var(--color-success)]" : "bg-[var(--color-rule)]"
            }`}
            title={!multiProvince ? "Activez d'abord l'expansion" : undefined}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${actif ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        )}
      </div>
    );
  }

  if (isLoading) return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">🌍 Expansion internationale</p>
      <p className="text-xs text-[var(--color-ink-soft)]">Chargement…</p>
    </Card>
  );

  return (
    <Card className="p-5 space-y-5">
      {/* ── En-tête + master toggle ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
            🌍 Expansion internationale
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1 max-w-sm">
            Activez les régions pour ouvrir la plateforme au Canada, en France et en Afrique francophone.
            Quand désactivé, seul le Québec est accessible.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {confirm && !multiProvince && (
            <p className="text-xs text-[var(--color-accent)] font-semibold max-w-xs text-right">
              Confirmez : la plateforme sera visible à l'international. Assurez-vous que le contenu des régions activées est prêt.
            </p>
          )}
          <button
            onClick={handleToggleMultiProvince}
            disabled={setMultiProvince.isPending}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${
              multiProvince
                ? "bg-[var(--color-rule)] text-[var(--color-ink)] hover:bg-red-50 hover:text-red-700"
                : confirm ? "bg-red-600 text-white hover:opacity-90"
                : "bg-[var(--color-ink)] text-white hover:opacity-90"
            }`}
          >
            {multiProvince ? "Désactiver l'expansion" : confirm ? "Confirmer l'activation" : "Activer l'expansion"}
          </button>
          {confirm && !multiProvince && (
            <button onClick={() => setConfirm(false)} className="text-xs text-[var(--color-ink-soft)] underline">Annuler</button>
          )}
        </div>
      </div>

      {/* ── Statut global ── */}
      <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 ${
        multiProvince ? "bg-[rgba(42,124,111,0.10)] text-[var(--color-success)]" : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
      }`}>
        <span>{multiProvince ? "🟢" : "⚪"}</span>
        {multiProvince ? `Expansion active — ${totalActifs} région(s) activée(s)` : "Expansion désactivée — plateforme QC uniquement"}
      </div>

      {/* ── Section Canada ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-ink-soft)] mb-2">🇨🇦 Canada — Provinces & territoires</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CANADA_CODES.map((code) => <RegionCard key={code} code={code} />)}
        </div>
      </div>

      {/* ── Section Francophonie ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-ink-soft)] mb-2">🌍 France & Afrique francophone</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {FRANCOPHONIE_CODES.map((code) => <RegionCard key={code} code={code} />)}
        </div>
      </div>

      {multiProvince && (
        <p className="text-[10px] text-[var(--color-ink-soft)]">
          💡 Les utilisateurs des régions activées voient l'interface adaptée à leur curriculum. Le contenu QC reste réservé aux élèves québécois.
        </p>
      )}
    </Card>
  );
}

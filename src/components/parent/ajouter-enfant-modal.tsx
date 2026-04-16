"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FocusTrap } from "@/components/ui/focus-trap";
import type { NiveauScolaire } from "@/generated/prisma";
import { getNiveauxParRegion, getCycleLabel } from "@/lib/education/region-education";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const REGIONS_INFO: Record<string, { nom: string; groupe: "canada" | "francophonie" }> = {
  QC: { nom: "Québec",                    groupe: "canada" },
  ON: { nom: "Ontario",                   groupe: "canada" },
  BC: { nom: "Colombie-Britannique",      groupe: "canada" },
  AB: { nom: "Alberta",                   groupe: "canada" },
  SK: { nom: "Saskatchewan",              groupe: "canada" },
  MB: { nom: "Manitoba",                  groupe: "canada" },
  NB: { nom: "Nouveau-Brunswick",         groupe: "canada" },
  NS: { nom: "Nouvelle-Écosse",           groupe: "canada" },
  PE: { nom: "Île-du-Prince-Édouard",     groupe: "canada" },
  NL: { nom: "Terre-Neuve-et-Labrador",   groupe: "canada" },
  YT: { nom: "Yukon",                     groupe: "canada" },
  NT: { nom: "Territoires du Nord-Ouest", groupe: "canada" },
  NU: { nom: "Nunavut",                   groupe: "canada" },
  FR: { nom: "France",                    groupe: "francophonie" },
  CI: { nom: "Côte d'Ivoire",             groupe: "francophonie" },
  SN: { nom: "Sénégal",                   groupe: "francophonie" },
  CM: { nom: "Cameroun",                  groupe: "francophonie" },
  BF: { nom: "Burkina Faso",              groupe: "francophonie" },
  ML: { nom: "Mali",                      groupe: "francophonie" },
  BJ: { nom: "Bénin",                     groupe: "francophonie" },
  TG: { nom: "Togo",                      groupe: "francophonie" },
  GA: { nom: "Gabon",                     groupe: "francophonie" },
  CD: { nom: "R.D. Congo",                groupe: "francophonie" },
  CG: { nom: "Congo-Brazzaville",         groupe: "francophonie" },
  GN: { nom: "Guinée",                    groupe: "francophonie" },
  MG: { nom: "Madagascar",                groupe: "francophonie" },
  NE: { nom: "Niger",                     groupe: "francophonie" },
  TD: { nom: "Tchad",                     groupe: "francophonie" },
  CF: { nom: "Rép. Centrafricaine",       groupe: "francophonie" },
  RW: { nom: "Rwanda",                    groupe: "francophonie" },
  BI: { nom: "Burundi",                   groupe: "francophonie" },
  DJ: { nom: "Djibouti",                  groupe: "francophonie" },
  KM: { nom: "Comores",                   groupe: "francophonie" },
};

interface Props {
  onClose: () => void;
  multiProvince?: boolean;
  provincesActives?: Record<string, boolean>;
}

type Onglet = "nouveau" | "lier";

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copier ${label}`}
      className="ml-2 rounded-lg border border-[var(--color-rule)] bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
    >
      {copied ? "✓ Copié" : "Copier"}
    </button>
  );
}

export function AjouterEnfantModal({ onClose, multiProvince = false, provincesActives = { QC: true } }: Props) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("nouveau");

  // Formulaire nouveau compte
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState<NiveauScolaire>("PRIMAIRE_1");
  const [ecole, setEcole] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [province, setProvince] = useState("QC");
  const NIVEAUX = getNiveauxParRegion(province);
  const cycleLabels = getCycleLabel(province);
  const [compteInfo, setCompteInfo] = useState<{ codeAcces: string; motDePasse: string } | null>(null);

  // Formulaire lier
  const [codeLier, setCodeLier] = useState("");
  const [prenomLie, setPrenomLie] = useState("");

  // Dirty state — pour confirmer avant de fermer
  const isDirty = prenom !== "" || nom !== "" || motDePasse !== "" || codeLier !== "";
  const submitted = compteInfo !== null || prenomLie !== "";

  const handleClose = useCallback(() => {
    if (isDirty && !submitted) {
      if (!window.confirm("Fermer cette fenêtre ? Les informations saisies seront perdues.")) return;
    }
    onClose();
  }, [isDirty, submitted, onClose]);

  const ajouter = trpc.parent.ajouterEnfant.useMutation({
    onSuccess: (data) => {
      setCompteInfo({ codeAcces: data.codeAcces, motDePasse: motDePasse });
      router.refresh();
      toast.success(`Compte de ${prenom} créé avec succès !`);
    },
    onError: (err) => toast.error(err.message),
  });

  const lier = trpc.parent.lierEnfantParCode.useMutation({
    onSuccess: (data) => {
      setPrenomLie(data.prenom);
      router.refresh();
      toast.success(`${data.prenom} est maintenant lié(e) à votre compte !`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAjouter = (e: React.FormEvent) => {
    e.preventDefault();
    ajouter.mutate({ prenom, nom, niveauScolaire: niveau, ecole: ecole || undefined, motDePasse, province: province as never });
  };

  const handleLier = (e: React.FormEvent) => {
    e.preventDefault();
    lier.mutate({ codeAcces: codeLier });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titre-enfant"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <FocusTrap>
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-[var(--shadow-elevated)] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] px-6 py-4">
          <h2 id="modal-titre-enfant" className="text-lg font-black text-[var(--color-ink)]">
            Ajouter un enfant
          </h2>
          <button
            onClick={handleClose}
            aria-label="Fermer la fenêtre"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-[var(--color-rule)]">
          <button
            onClick={() => setOnglet("nouveau")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              onglet === "nouveau"
                ? "border-b-2 border-[var(--color-ink)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            🆕 Nouveau compte
          </button>
          <button
            onClick={() => setOnglet("lier")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              onglet === "lier"
                ? "border-b-2 border-[var(--color-ink)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            🔗 Lier un compte existant
          </button>
        </div>

        <div className="p-6">
          {/* ─── Onglet Nouveau ─── */}
          {onglet === "nouveau" && (
            <>
              {compteInfo ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">
                    Compte créé !
                  </h3>
                  <p className="text-sm text-[var(--color-ink-soft)] mb-5">
                    Voici les informations de connexion de votre enfant. Copiez-les maintenant !
                  </p>
                  <div className="rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-4 text-left space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                          Code d'accès élève
                        </p>
                        <CopyBtn value={compteInfo.codeAcces} label="le code d'accès" />
                      </div>
                      <p className="text-xl font-black font-mono text-[var(--color-ink)] tracking-widest">
                        {compteInfo.codeAcces}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                        Votre enfant l'entre à la place d'un courriel
                      </p>
                    </div>
                    <div className="border-t border-[var(--color-rule)] pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                          Mot de passe
                        </p>
                        <CopyBtn value={compteInfo.motDePasse} label="le mot de passe" />
                      </div>
                      <p className="text-sm font-mono font-bold text-[var(--color-ink)]">
                        {compteInfo.motDePasse}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] p-3 mb-5">
                    <p className="text-xs text-[var(--color-success)]">
                      💡 Sur la page de connexion, votre enfant clique sur <strong>«&nbsp;Je suis élève&nbsp;»</strong> et entre son code d'accès.
                    </p>
                  </div>
                  <Button onClick={onClose} className="w-full">
                    Fermer
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAjouter} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                        Prénom *
                      </label>
                      <Input
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        placeholder="Emma"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                        Nom *
                      </label>
                      <Input
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Tremblay"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                      Niveau scolaire *
                    </label>
                    <select
                      value={niveau}
                      onChange={(e) => setNiveau(e.target.value as NiveauScolaire)}
                      className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none"
                    >
                      {(() => {
                        const primaireNiveaux = NIVEAUX.filter((n) => n.cycle === cycleLabels.primaire || n.cycle === "Primaire" || n.cycle === "Elementary");
                        const secondaireNiveaux = NIVEAUX.filter((n) => !primaireNiveaux.includes(n));
                        return (
                          <>
                            <optgroup label={cycleLabels.primaire}>
                              {primaireNiveaux.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </optgroup>
                            <optgroup label={cycleLabels.secondaire}>
                              {secondaireNiveaux.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </optgroup>
                          </>
                        );
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                      École (optionnel)
                    </label>
                    <Input
                      value={ecole}
                      onChange={(e) => setEcole(e.target.value)}
                      placeholder="École primaire des Érables"
                    />
                  </div>

                  {multiProvince && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                        🌍 Région / Pays *
                      </label>
                      <select
                        value={province}
                        onChange={(e) => { setProvince(e.target.value); setNiveau(getNiveauxParRegion(e.target.value)[0]?.value as NiveauScolaire ?? "PRIMAIRE_1"); }}
                        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none"
                      >
                        {(() => {
                          const canada = Object.entries(REGIONS_INFO).filter(([code, r]) => r.groupe === "canada" && provincesActives[code]);
                          const franco = Object.entries(REGIONS_INFO).filter(([code, r]) => r.groupe === "francophonie" && provincesActives[code]);
                          return (
                            <>
                              {canada.length > 0 && (
                                <optgroup label="🇨🇦 Canada">
                                  {canada.map(([code, r]) => <option key={code} value={code}>{r.nom}</option>)}
                                </optgroup>
                              )}
                              {franco.length > 0 && (
                                <optgroup label="🌍 France & Afrique francophone">
                                  {franco.map(([code, r]) => <option key={code} value={code}>{r.nom}</option>)}
                                </optgroup>
                              )}
                            </>
                          );
                        })()}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                      Mot de passe pour votre enfant *
                    </label>
                    <Input
                      type="password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      minLength={6}
                      required
                    />
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      Choisissez un mot de passe simple que votre enfant peut retenir.
                    </p>
                  </div>

                  {ajouter.isError && (
                    <p className="text-xs text-[var(--color-accent)]">
                      {ajouter.error.message}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={!prenom || !nom || !motDePasse || ajouter.isPending}
                      className="flex-[2]"
                    >
                      {ajouter.isPending ? "Création…" : "Créer le compte"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ─── Onglet Lier ─── */}
          {onglet === "lier" && (
            <>
              {prenomLie ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">
                    {prenomLie} est maintenant lié(e) à votre compte !
                  </h3>
                  <p className="text-sm text-[var(--color-ink-soft)] mb-6">
                    Vous pouvez suivre sa progression depuis votre tableau de bord.
                  </p>
                  <Button onClick={onClose} className="w-full">
                    Fermer
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLier} className="space-y-4">
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    Si votre enfant a déjà un compte ÉduRéussite QC, entrez son <strong>code d'accès</strong> pour lier les comptes.
                  </p>

                  <div className="rounded-lg bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-2.5">
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      💡 Le code d'accès ressemble à <strong>Emma-4821</strong>. Il se trouve sur la page de connexion élève ou dans le tableau de bord du parent qui a créé le compte.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
                      Code d'accès de votre enfant *
                    </label>
                    <Input
                      value={codeLier}
                      onChange={(e) => setCodeLier(e.target.value)}
                      placeholder="Ex : Emma-4821"
                      required
                    />
                  </div>

                  {lier.isError && (
                    <p className="text-xs text-[var(--color-accent)]">
                      {lier.error.message}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={!codeLier || lier.isPending}
                      className="flex-[2]"
                    >
                      {lier.isPending ? "Recherche…" : "Lier le compte"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      </FocusTrap>
    </div>
  );
}

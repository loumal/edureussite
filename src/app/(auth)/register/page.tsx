"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
type RegisterRole = "PARENT" | "ENSEIGNANT";

const ROLES: { value: RegisterRole; emoji: string; label: string; desc: string }[] = [
  { value: "PARENT", emoji: "👨‍👩‍👧", label: "Parent", desc: "Je suis le parent d'un élève" },
  { value: "ENSEIGNANT", emoji: "👩‍🏫", label: "Enseignant(e)", desc: "Je suis l'enseignant(e)" },
];

const REGIONS_INFO: Record<string, { label: string; groupe: "canada" | "francophonie" }> = {
  // Canada
  QC: { label: "Québec",                    groupe: "canada" },
  ON: { label: "Ontario",                   groupe: "canada" },
  BC: { label: "Colombie-Britannique",      groupe: "canada" },
  AB: { label: "Alberta",                   groupe: "canada" },
  SK: { label: "Saskatchewan",              groupe: "canada" },
  MB: { label: "Manitoba",                  groupe: "canada" },
  NB: { label: "Nouveau-Brunswick",         groupe: "canada" },
  NS: { label: "Nouvelle-Écosse",           groupe: "canada" },
  PE: { label: "Île-du-Prince-Édouard",     groupe: "canada" },
  NL: { label: "Terre-Neuve-et-Labrador",   groupe: "canada" },
  YT: { label: "Yukon",                     groupe: "canada" },
  NT: { label: "Territoires du Nord-Ouest", groupe: "canada" },
  NU: { label: "Nunavut",                   groupe: "canada" },
  // France
  FR: { label: "France",                    groupe: "francophonie" },
  // Afrique francophone
  CI: { label: "Côte d'Ivoire",             groupe: "francophonie" },
  SN: { label: "Sénégal",                   groupe: "francophonie" },
  CM: { label: "Cameroun",                  groupe: "francophonie" },
  BF: { label: "Burkina Faso",              groupe: "francophonie" },
  ML: { label: "Mali",                      groupe: "francophonie" },
  BJ: { label: "Bénin",                     groupe: "francophonie" },
  TG: { label: "Togo",                      groupe: "francophonie" },
  GA: { label: "Gabon",                     groupe: "francophonie" },
  CD: { label: "R.D. Congo",                groupe: "francophonie" },
  CG: { label: "Congo-Brazzaville",         groupe: "francophonie" },
  GN: { label: "Guinée",                    groupe: "francophonie" },
  MG: { label: "Madagascar",                groupe: "francophonie" },
  NE: { label: "Niger",                     groupe: "francophonie" },
  TD: { label: "Tchad",                     groupe: "francophonie" },
  CF: { label: "Rép. Centrafricaine",       groupe: "francophonie" },
  RW: { label: "Rwanda",                    groupe: "francophonie" },
  BI: { label: "Burundi",                   groupe: "francophonie" },
  DJ: { label: "Djibouti",                  groupe: "francophonie" },
  KM: { label: "Comores",                   groupe: "francophonie" },
};

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("PARENT");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState("QC");
  const [error, setError] = useState("");

  const { data: featureFlags } = trpc.auth.getPublicFeatureFlags.useQuery();
  const multiProvince = featureFlags?.multiProvince ?? false;
  const provincesActives = featureFlags?.provincesActives ?? { QC: true };

  // OTP step
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      setStep("otp");
      setTimeout(() => inputs.current[0]?.focus(), 100);
    },
    onError: (err: { message: string }) => setError(err.message),
  });

  const resend = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { setResent(true); setTimeout(() => setResent(false), 30000); },
  });

  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: async () => {
      // Email vérifié → connecter automatiquement
      const result = await signIn("credentials", {
        email,
        password,
        otp: "000000",
        redirect: false,
      });
      if (result?.ok) {
        router.push("/");
        router.refresh();
      } else {
        // Fallback : rediriger vers login
        router.push("/login?verified=1");
      }
    },
    onError: (err) => {
      setOtpError(err.message);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    },
  });

  const code = otp.join("");

  useEffect(() => {
    if (step === "otp" && code.length === 6) {
      setOtpLoading(true);
      verify.mutate({ email, otp: code });
      setOtpLoading(false);
    }
  }, [code]); // eslint-disable-line

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); inputs.current[5]?.focus(); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    register.mutate({ email, password, role, prenom, nom, province: province as never });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">✦ ÉduRéussite QC</div>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {step === "form" ? "Créer votre compte" : "Vérification du courriel"}
          </p>
        </div>

        <Card className="p-8">
          {step === "otp" ? (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📧</div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">Vérifiez votre courriel</h1>
                <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                  Un code à 6 chiffres a été envoyé à<br />
                  <span className="font-semibold text-[var(--color-ink)]">{email}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 rounded-xl border-2 text-center text-xl font-black outline-none transition-all
                      ${digit ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]" : "border-[var(--color-rule)]"}
                      ${otpError ? "border-[var(--color-accent)]" : ""}
                      focus:border-[var(--color-ink)]`}
                  />
                ))}
              </div>

              {otpError && (
                <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3 mb-4">
                  <p className="text-sm text-[var(--color-accent)] text-center">{otpError}</p>
                </div>
              )}

              <Button
                onClick={() => verify.mutate({ email, otp: code })}
                loading={otpLoading || verify.isPending}
                disabled={code.length < 6}
                size="lg"
                className="w-full"
              >
                Vérifier et accéder
              </Button>

              <div className="mt-4 text-center text-sm">
                {resent ? (
                  <p className="text-[var(--color-success)] font-medium">Code renvoyé ✓</p>
                ) : (
                  <button
                    onClick={() => resend.mutate({ email, purpose: "verification" })}
                    disabled={resend.isPending}
                    className="text-[var(--color-accent)] hover:underline disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
                  className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                >
                  ← Modifier mes informations
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[var(--color-ink)] mb-4">Qui êtes-vous ?</h1>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      role === r.value
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                        : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
                    }`}
                  >
                    <div className="text-xl mb-1">{r.emoji}</div>
                    <div className={`text-xs font-semibold ${role === r.value ? "text-white" : "text-[var(--color-ink)]"}`}>
                      {r.label}
                    </div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                  <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>
                <Input label="Courriel" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Minimum 8 caractères" required />

                {multiProvince && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">
                      🌍 Région / Province
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm focus:border-[var(--color-ink)] focus:outline-none"
                    >
                      {(() => {
                        const canada = Object.entries(REGIONS_INFO).filter(([code, r]) => r.groupe === "canada" && provincesActives[code]);
                        const franco = Object.entries(REGIONS_INFO).filter(([code, r]) => r.groupe === "francophonie" && provincesActives[code]);
                        return (
                          <>
                            {canada.length > 0 && (
                              <optgroup label="🇨🇦 Canada">
                                {canada.map(([code, r]) => <option key={code} value={code}>{r.label}</option>)}
                              </optgroup>
                            )}
                            {franco.length > 0 && (
                              <optgroup label="🌍 France & Afrique francophone">
                                {franco.map(([code, r]) => <option key={code} value={code}>{r.label}</option>)}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                )}

                {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

                <Button type="submit" loading={register.isPending} size="lg" className="w-full">
                  Créer mon compte
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-[var(--color-ink-soft)]">
                En créant un compte, vous acceptez notre{" "}
                <Link href="/politique-confidentialite" className="text-[var(--color-accent)] hover:underline" target="_blank">
                  politique de confidentialité
                </Link>.
              </p>

              <p className="mt-3 text-center text-sm text-[var(--color-ink-soft)]">
                Déjà un compte ?{" "}
                <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">Se connecter</Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

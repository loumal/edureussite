"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => { setStep("otp"); setError(""); setTimeout(() => inputs.current[0]?.focus(), 100); },
    onError: (err) => setError(err.message),
  });

  const confirmReset = trpc.auth.confirmPasswordReset.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => setError(err.message),
  });

  const code = otp.join("");

  useEffect(() => {
    if (step === "otp" && code.length === 6) setStep("newPassword");
  }, [code]); // eslint-disable-line

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); inputs.current[5]?.focus(); }
  };

  const handleConfirmPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    confirmReset.mutate({ email, otp: code, newPassword });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">✦ Édu-Réussite QC</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Réinitialisation du mot de passe</p>
        </div>

        <Card className="p-8">
          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔑</div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">Mot de passe oublié ?</h1>
                <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                  Entrez votre adresse courriel pour recevoir un code de réinitialisation.
                </p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setError(""); requestReset.mutate({ email }); }} className="space-y-4">
                <Input
                  label="Adresse courriel"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  required
                />
                {error && (
                  <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
                    <p className="text-sm text-[var(--color-accent)]">{error}</p>
                  </div>
                )}
                <Button type="submit" loading={requestReset.isPending} size="lg" className="w-full">
                  Envoyer le code
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-[var(--color-ink-soft)]">
                <Link href="/forgot-password/eleve" className="text-[var(--color-accent)] hover:underline">
                  Mon enfant a oublié son mot de passe
                </Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📬</div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">Code de vérification</h1>
                <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                  Un code a été envoyé à<br />
                  <span className="font-semibold text-[var(--color-ink)]">{email}</span>
                </p>
              </div>
              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 rounded-xl border-2 text-center text-xl font-black outline-none transition-all
                      ${digit ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]" : "border-[var(--color-rule)]"}
                      focus:border-[var(--color-ink)]`}
                  />
                ))}
              </div>
              {error && (
                <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3 mb-4">
                  <p className="text-sm text-[var(--color-accent)] text-center">{error}</p>
                </div>
              )}
              <div className="text-center mt-3">
                <button onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                  ← Changer d'adresse
                </button>
              </div>
            </>
          )}

          {step === "newPassword" && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔒</div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">Nouveau mot de passe</h1>
                <p className="text-sm text-[var(--color-ink-soft)] mt-2">Choisissez un mot de passe sécurisé.</p>
              </div>
              <form onSubmit={handleConfirmPassword} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                {error && (
                  <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
                    <p className="text-sm text-[var(--color-accent)]">{error}</p>
                  </div>
                )}
                <Button type="submit" loading={confirmReset.isPending} size="lg" className="w-full">
                  Réinitialiser le mot de passe
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Mot de passe réinitialisé !</h1>
              <p className="text-sm text-[var(--color-ink-soft)] mb-6">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <Button onClick={() => router.push("/login?reset=1")} size="lg" className="w-full">
                Se connecter
              </Button>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          <Link href="/login" className="hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

type Mode = "choix" | "eleve" | "adulte";
type StepAdulte = "credentials" | "otp";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified") === "1";
  const passwordReset = params.get("reset") === "1";

  const [mode, setMode] = useState<Mode>("choix");

  // --- Élève ---
  const [codeAcces, setCodeAcces] = useState("");
  const [passwordEleve, setPasswordEleve] = useState("");
  const [errorEleve, setErrorEleve] = useState("");

  // --- Adulte ---
  const [step, setStep] = useState<StepAdulte>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorAdulte, setErrorAdulte] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const loginEleve = trpc.auth.loginEleve.useMutation({
    onSuccess: async ({ email: internalEmail }) => {
      const result = await signIn("credentials", {
        email: internalEmail,
        password: passwordEleve,
        otp: "000000", // ignoré pour les comptes internes
        redirect: false,
      });
      if (result?.error) {
        setErrorEleve("Code d'accès ou mot de passe incorrect.");
      } else {
        router.push("/");
        router.refresh();
      }
    },
    onError: (err) => setErrorEleve(err.message),
  });

  const initiateLogin = trpc.auth.initiateLogin.useMutation({
    onSuccess: () => { setStep("otp"); setErrorAdulte(""); setTimeout(() => inputs.current[0]?.focus(), 100); },
    onError: (err) => {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setErrorAdulte(err.message);
      }
    },
  });

  const resend = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { setResent(true); setTimeout(() => setResent(false), 30000); },
  });

  const code = otp.join("");

  useEffect(() => {
    if (step === "otp" && code.length === 6) handleVerifyOtp(code);
  }, [code]); // eslint-disable-line

  const handleVerifyOtp = async (otpCode: string) => {
    setLoadingOtp(true);
    const result = await signIn("credentials", { email, password, otp: otpCode, redirect: false });
    setLoadingOtp(false);
    if (result?.error) {
      setErrorAdulte("Code incorrect ou expiré.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setErrorAdulte("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); inputs.current[5]?.focus(); }
  };

  // ── CHOIX DU PROFIL ────────────────────────────────────────────────────────
  if (mode === "choix") {
    return (
      <Card className="p-8">
        {verified && (
          <div className="mb-5 rounded-lg bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] p-3">
            <p className="text-sm text-[var(--color-success)] text-center font-medium">✓ Courriel vérifié — vous pouvez vous connecter</p>
          </div>
        )}
        {passwordReset && (
          <div className="mb-5 rounded-lg bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] p-3">
            <p className="text-sm text-[var(--color-success)] text-center font-medium">🔑 Mot de passe réinitialisé — connectez-vous avec votre nouveau mot de passe</p>
          </div>
        )}
        <h1 className="text-xl font-bold text-[var(--color-ink)] mb-6 text-center">Qui êtes-vous ?</h1>
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
          <button
            onClick={() => setMode("eleve")}
            className="rounded-2xl border-2 border-[var(--color-rule)] p-5 text-center hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-all group"
          >
            <div className="text-3xl mb-2">🎒</div>
            <p className="font-bold text-sm text-[var(--color-ink)]">Je suis élève</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">Connexion avec mon code</p>
          </button>
          <button
            onClick={() => setMode("adulte")}
            className="rounded-2xl border-2 border-[var(--color-rule)] p-5 text-center hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-all group"
          >
            <div className="text-3xl mb-2">👤</div>
            <p className="font-bold text-sm text-[var(--color-ink)]">Parent / Enseignant</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">Connexion avec mon courriel</p>
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-[var(--color-accent)] hover:underline">Créer un compte</Link>
        </p>
      </Card>
    );
  }

  // ── CONNEXION ÉLÈVE ────────────────────────────────────────────────────────
  if (mode === "eleve") {
    return (
      <Card className="p-8">
        <button onClick={() => setMode("choix")} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] mb-5 flex items-center gap-1">
          ← Retour
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎒</div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Connexion élève</h1>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">Utilise le code que ton parent t'a donné</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setErrorEleve(""); loginEleve.mutate({ codeAcces, password: passwordEleve }); }} className="space-y-4">
          <Input
            label="Mon code d'accès"
            value={codeAcces}
            onChange={(e) => setCodeAcces(e.target.value)}
            placeholder="ex: Emma-4821"
            autoComplete="username"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={passwordEleve}
            onChange={(e) => setPasswordEleve(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {errorEleve && (
            <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
              <p className="text-sm text-[var(--color-accent)]">{errorEleve}</p>
            </div>
          )}
          <Button type="submit" loading={loginEleve.isPending} size="lg" className="w-full">
            Se connecter
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/forgot-password/eleve" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
      </Card>
    );
  }

  // ── CONNEXION ADULTE (PARENT / ENSEIGNANT) ─────────────────────────────────
  return (
    <Card className="p-8">
      {step === "credentials" ? (
        <>
          <button onClick={() => setMode("choix")} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] mb-5 flex items-center gap-1">
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-6">Se connecter</h1>
          <form onSubmit={(e) => { e.preventDefault(); setErrorAdulte(""); initiateLogin.mutate({ email, password }); }} className="space-y-4">
            <Input label="Adresse courriel" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" required />
            <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
            {errorAdulte && (
              <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
                <p className="text-sm text-[var(--color-accent)]">{errorAdulte}</p>
              </div>
            )}
            <Button type="submit" loading={initiateLogin.isPending} size="lg" className="w-full mt-2">Continuer</Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <p className="mt-3 text-center text-sm text-[var(--color-ink-soft)]">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-[var(--color-accent)] hover:underline">Créer un compte</Link>
          </p>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-[var(--color-ink)]">Code de vérification</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2">
              Un code a été envoyé à<br />
              <span className="font-semibold text-[var(--color-ink)]">{email}</span>
            </p>
          </div>
          <div className="flex gap-1.5 justify-center mb-4 sm:gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`h-12 w-10 rounded-xl border-2 text-center text-xl font-black outline-none transition-all sm:h-14 sm:w-11
                  ${digit ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]" : "border-[var(--color-rule)]"}
                  ${errorAdulte ? "border-[var(--color-accent)]" : ""}
                  focus:border-[var(--color-ink)]`}
              />
            ))}
          </div>
          {errorAdulte && (
            <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3 mb-4">
              <p className="text-sm text-[var(--color-accent)] text-center">{errorAdulte}</p>
            </div>
          )}
          <Button onClick={() => handleVerifyOtp(code)} loading={loadingOtp} disabled={code.length < 6} size="lg" className="w-full">
            Se connecter
          </Button>
          <div className="mt-4 text-center text-sm">
            {resent ? (
              <p className="text-[var(--color-success)] font-medium">Code renvoyé ✓</p>
            ) : (
              <button onClick={() => resend.mutate({ email, purpose: "login" })} disabled={resend.isPending} className="text-[var(--color-accent)] hover:underline disabled:opacity-50">
                Renvoyer le code
              </button>
            )}
          </div>
          <div className="mt-3 text-center">
            <button onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); setErrorAdulte(""); }} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              ← Changer d'adresse
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">✦ ÉduRéussite QC</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Réussite pour chaque élève</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          <Link href="/politique-confidentialite" className="hover:underline">
            Politique de confidentialité
          </Link>
          {" · "}© 2026 ÉduRéussite QC
        </p>
      </div>
    </div>
  );
}

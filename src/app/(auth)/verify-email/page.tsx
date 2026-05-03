"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => router.push("/login?verified=1"),
    onError: (err) => setError(err.message),
  });

  const resend = trpc.auth.resendOtp.useMutation({
    onSuccess: () => {
      setResent(true);
      setTimeout(() => setResent(false), 30000);
    },
  });

  const code = otp.join("");

  useEffect(() => {
    if (code.length === 6) {
      verify.mutate({ email, otp: code });
    }
  }, [code]); // eslint-disable-line

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputs.current[5]?.focus();
    }
  };

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-[var(--color-ink-soft)]">Lien invalide.</p>
        <Link href="/register" className="text-sm text-[var(--color-accent)] hover:underline mt-2 block">
          Retour à l'inscription
        </Link>
      </div>
    );
  }

  return (
    <Card className="p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📧</div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">
          Vérifiez votre courriel
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-2">
          Un code à 6 chiffres a été envoyé à<br />
          <span className="font-semibold text-[var(--color-ink)]">{email}</span>
        </p>
      </div>

      {/* Inputs OTP */}
      <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 h-14 rounded-xl border-2 text-center text-xl font-black outline-none transition-all
              ${digit ? "border-[var(--color-ink)] bg-[var(--color-paper-warm)]" : "border-[var(--color-rule)]"}
              ${error ? "border-[var(--color-accent)]" : ""}
              focus:border-[var(--color-ink)]`}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3 mb-4">
          <p className="text-sm text-[var(--color-accent)] text-center">{error}</p>
        </div>
      )}

      <Button
        onClick={() => verify.mutate({ email, otp: code })}
        loading={verify.isPending}
        disabled={code.length < 6}
        size="lg"
        className="w-full"
      >
        Vérifier
      </Button>

      <div className="mt-4 text-center text-sm text-[var(--color-ink-soft)]">
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
        <Link href="/register" className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
          ← Retour à l'inscription
        </Link>
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">
            ✦ Édu-Réussite QC
          </div>
        </div>
        <Suspense>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}

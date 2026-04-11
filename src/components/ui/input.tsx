"use client";

import { cn } from "@/lib/utils/cn";
import { forwardRef, useState } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const [visible, setVisible] = useState(false);

    const inputEl = (
      <input
        id={inputId}
        ref={ref}
        type={isPassword ? (visible ? "text" : "password") : type}
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] border bg-white px-3.5 text-sm text-[var(--color-ink)] outline-none transition-all placeholder:text-[var(--color-ink-soft)]/50",
          isPassword && "pr-10",
          error
            ? "border-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(217,79,43,0.2)]"
            : "border-[var(--color-rule)] focus:border-[var(--color-ink-soft)] focus:ring-2 focus:ring-[rgba(15,22,35,0.08)]",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        {isPassword ? (
          <div className="relative">
            {inputEl}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
            >
              {visible ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        ) : (
          inputEl
        )}
        {hint && !error && <p className="text-xs text-[var(--color-ink-soft)]">{hint}</p>}
        {error && <p className="text-xs text-[var(--color-accent)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

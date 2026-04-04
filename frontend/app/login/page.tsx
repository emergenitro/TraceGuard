"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestOtp } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await requestOtp(email.trim().toLowerCase());
      setStep("otp");
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), otp.trim());
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setSubmitting(true);
    try {
      await requestOtp(email.trim().toLowerCase());
      setCountdown(60);
      setOtp("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-[#ffb000] tracking-tighter font-headline uppercase">
            TraceGuard
          </span>
          <p className="mt-2 text-[10px] font-label font-bold uppercase tracking-widest text-outline">
            {step === "email" ? "Sign in or create account" : "Enter your code"}
          </p>
        </div>

        <div className="bg-surface-container p-1 shadow-2xl">
          <div className="bg-surface-container-lowest p-8 border border-[#524533]/10">
            {step === "email" ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full bg-surface-container-low border-0 border-b border-[#524533]/30 text-on-surface focus:outline-none focus:border-primary tabular-data px-3 py-3 transition-all placeholder:text-outline/50"
                  />
                </div>

                {error && (
                  <p className="text-[10px] font-label text-red-400 uppercase tracking-widest">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold tracking-widest flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : null}
                  SEND CODE
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <p className="text-[10px] font-label text-outline uppercase tracking-widest mb-1">
                    Code sent to
                  </p>
                  <p className="text-sm text-on-surface font-medium">{email}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full bg-surface-container-low border-0 border-b border-[#524533]/30 text-on-surface focus:outline-none focus:border-primary tabular-data px-3 py-3 transition-all placeholder:text-outline/50 text-2xl tracking-[0.4em]"
                  />
                </div>

                {error && (
                  <p className="text-[10px] font-label text-red-400 uppercase tracking-widest">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold tracking-widest flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : null}
                  VERIFY
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                    className="text-[10px] font-label text-outline uppercase tracking-widest hover:text-on-surface transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || submitting}
                    className="text-[10px] font-label text-outline uppercase tracking-widest hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

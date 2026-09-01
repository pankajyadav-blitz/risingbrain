"use client";

import * as React from "react";
import Link from "next/link";
import {
  Brain,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import { isStrongPassword } from "@/lib/auth/password-policy";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

type Mode = "login" | "signup";
type View =
  | "login"
  | "signup"
  | "signup-otp"
  | "forgot-email"
  | "forgot-otp"
  | "forgot-reset";

export function AuthForm({ mode, callbackUrl }: { mode: Mode; callbackUrl?: string }) {
  const isSignup = mode === "signup";
  const [view, setView] = React.useState<View>(isSignup ? "signup" : "login");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [code, setCode] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  // Stays true through the full-page redirect after a successful auth action, so
  // the overlay covers the navigation gap (where `loading` has already reset).
  const [redirecting, setRedirecting] = React.useState(false);

  // `callbackUrl` is a query param, so it is attacker-controlled: without this
  // an attacker's link would land the user on their site the instant a real
  // sign-in succeeds. Validated once here, used by every success path below.
  const destination = safeRedirectPath(callbackUrl);
  const next = callbackUrl ? `?callbackUrl=${encodeURIComponent(destination)}` : "";

  function goTo(v: View, opts?: { notice?: string }) {
    setError(null);
    setNotice(opts?.notice ?? null);
    setView(v);
  }

  /** POST helper that returns the parsed body + ok flag and manages loading/error. */
  async function post(url: string, body: unknown) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return { ok: false as const, data };
      }
      return { ok: true as const, data };
    } catch {
      setError("Network error. Please try again.");
      return { ok: false as const, data: {} as { error?: string; token?: string } };
    } finally {
      setLoading(false);
    }
  }

  // ---- Login -------------------------------------------------------------
  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    const { ok } = await post("/api/auth/login", { email, password, remember });
    if (ok) {
      setRedirecting(true);
      window.location.href = destination;
    }
  }

  // ---- Signup: request code → verify code --------------------------------
  async function onSignupStart(e: React.FormEvent) {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      setError("Please choose a stronger password (see the checklist).");
      return;
    }
    const { ok } = await post("/api/auth/register/start", { name, email, password });
    if (ok) {
      setCode("");
      goTo("signup-otp", { notice: `We sent a 6-digit code to ${email}.` });
    }
  }

  async function onSignupVerify(submitted?: string) {
    const value = submitted ?? code;
    const { ok } = await post("/api/auth/register/verify", { email, code: value });
    if (ok) {
      setRedirecting(true);
      window.location.href = destination;
    }
  }

  // ---- Forgot password: email → code → new password ----------------------
  async function onForgotEmail(e: React.FormEvent) {
    e.preventDefault();
    const { ok } = await post("/api/auth/password/forgot", { email });
    if (ok) {
      setCode("");
      goTo("forgot-otp", { notice: `We sent a 6-digit code to ${email}.` });
    }
  }

  async function onForgotVerify(submitted?: string) {
    const value = submitted ?? code;
    const { ok, data } = await post("/api/auth/password/verify", { email, code: value });
    if (ok && data.token) {
      setResetToken(data.token);
      setPassword("");
      goTo("forgot-reset");
    }
  }

  async function onForgotReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      setError("Please choose a stronger password (see the checklist).");
      return;
    }
    const { ok } = await post("/api/auth/password/reset", { email, token: resetToken, password });
    if (ok) {
      setPassword("");
      setResetToken("");
      goTo("login", { notice: "Password updated. You can sign in now." });
    }
  }

  async function resendSignup() {
    const { ok } = await post("/api/auth/register/start", { name, email, password });
    if (ok) setNotice(`We sent a new code to ${email}.`);
  }

  async function resendForgot() {
    const { ok } = await post("/api/auth/password/forgot", { email });
    if (ok) setNotice(`We sent a new code to ${email}.`);
  }

  const headings: Record<View, { title: string; subtitle: string }> = {
    login: { title: "Sign in", subtitle: "Pick up right where you left off." },
    signup: { title: "Create your account", subtitle: "Join free — no credit card required." },
    "signup-otp": { title: "Verify your email", subtitle: "Enter the 6-digit code we emailed you." },
    "forgot-email": {
      title: "Reset your password",
      subtitle: "Enter your email and we'll send a reset code.",
    },
    "forgot-otp": { title: "Enter the code", subtitle: "Check your inbox for the 6-digit code." },
    "forgot-reset": { title: "Set a new password", subtitle: "Choose a strong new password." },
  };
  const heading = headings[view];

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      {/* Covers the full-page redirect after a successful sign-in / sign-up. */}
      <LoadingOverlay show={redirecting} label="Signing in" />
      <div className="glass grid w-full max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-2">
        {/* Brand showcase */}
        <div className="relative hidden flex-col justify-between border-r border-border bg-gradient-to-br from-rb-green-900/30 via-surface/20 to-surface-2/40 p-10 lg:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rb-green-500">
              <Brain className="h-5 w-5 text-rb-green-900" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-semibold text-foreground">
              Rising<span className="text-rb-green-400">Brain</span>
            </span>
          </Link>

          <div>
            <h2 className="text-3xl font-bold leading-tight text-foreground">
              {isSignup ? (
                <>
                  Start your journey to{" "}
                  <span className="text-gradient">cracking the interview.</span>
                </>
              ) : (
                <>
                  Welcome back to your <span className="text-gradient">grind.</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-sm text-muted">
              Curated DSA sheets, a real coding arena, live contests and the interview stories
              that got people hired — all in one glassy home.
            </p>
          </div>

          <div className="flex gap-6">
            {[
              ["1,200+", "Problems"],
              ["28", "Patterns"],
              ["50k", "Learners"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-xl font-bold text-rb-green-300">{n}</div>
                <div className="text-xs text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{heading.title}</h1>
            <p className="mt-1 text-sm text-muted">{heading.subtitle}</p>
          </div>

          {notice && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-rb-green-500/30 bg-rb-green-500/10 px-3.5 py-2.5 text-sm text-rb-green-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* ----- Social + email login / signup entry forms ----- */}
          {(view === "login" || view === "signup") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* These are API routes (server-side OAuth handshake), not pages —
                    a full navigation is intended, so a plain anchor is correct. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/auth/oauth/google"
                  className="glass-pill glass-hover inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-foreground"
                >
                  <Globe className="h-4 w-4" /> Google
                </a>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/auth/oauth/github"
                  className="glass-pill glass-hover inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-foreground"
                >
                  <KeyRound className="h-4 w-4" /> GitHub
                </a>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                or continue with email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {/* ----- LOGIN ----- */}
          {view === "login" && (
            <form className="space-y-4" onSubmit={onLogin}>
              <Field
                icon={Mail}
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <PasswordField
                value={password}
                onChange={setPassword}
                show={show}
                setShow={setShow}
                autoComplete="current-password"
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-rb-green-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => goTo("forgot-email")}
                  className="text-rb-green-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <SubmitButton loading={loading} label="Sign in" />
            </form>
          )}

          {/* ----- SIGNUP (collect details) ----- */}
          {view === "signup" && (
            <form className="space-y-4" onSubmit={onSignupStart}>
              <Field
                icon={User}
                label="Full name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={setName}
                autoComplete="name"
              />
              <Field
                icon={Mail}
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <div>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  show={show}
                  setShow={setShow}
                  autoComplete="new-password"
                />
                <PasswordChecklist value={password} />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <SubmitButton loading={loading} label="Continue" />
            </form>
          )}

          {/* ----- SIGNUP OTP ----- */}
          {view === "signup-otp" && (
            <OtpStep
              code={code}
              setCode={setCode}
              onSubmit={() => onSignupVerify()}
              onComplete={(c) => onSignupVerify(c)}
              onResend={resendSignup}
              onBack={() => goTo("signup")}
              loading={loading}
              error={error}
              submitLabel="Verify & create account"
            />
          )}

          {/* ----- FORGOT: email ----- */}
          {view === "forgot-email" && (
            <form className="space-y-4" onSubmit={onForgotEmail}>
              <Field
                icon={Mail}
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <SubmitButton loading={loading} label="Send reset code" />
              <BackLink onClick={() => goTo("login")} label="Back to sign in" />
            </form>
          )}

          {/* ----- FORGOT: otp ----- */}
          {view === "forgot-otp" && (
            <OtpStep
              code={code}
              setCode={setCode}
              onSubmit={() => onForgotVerify()}
              onComplete={(c) => onForgotVerify(c)}
              onResend={resendForgot}
              onBack={() => goTo("forgot-email")}
              loading={loading}
              error={error}
              submitLabel="Verify code"
            />
          )}

          {/* ----- FORGOT: reset ----- */}
          {view === "forgot-reset" && (
            <form className="space-y-4" onSubmit={onForgotReset}>
              <div>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  show={show}
                  setShow={setShow}
                  autoComplete="new-password"
                  label="New password"
                />
                <PasswordChecklist value={password} />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <SubmitButton loading={loading} label="Update password" icon={CheckCircle2} />
            </form>
          )}

          {/* ----- Footer link (only on the entry views) ----- */}
          {(view === "login" || view === "signup") && (
            <p className="mt-6 text-center text-sm text-muted">
              {isSignup ? "Already have an account? " : "New to RisingBrain? "}
              <Link
                href={isSignup ? `/login${next}` : `/signup${next}`}
                className="font-medium text-rb-green-300 hover:underline"
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** OTP entry step shared by signup + forgot-password. */
function OtpStep({
  code,
  setCode,
  onSubmit,
  onComplete,
  onResend,
  onBack,
  loading,
  error,
  submitLabel,
}: {
  code: string;
  setCode: (c: string) => void;
  onSubmit: () => void;
  onComplete: (c: string) => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <OtpInput value={code} onChange={setCode} onComplete={onComplete} disabled={loading} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <SubmitButton loading={loading} label={submitLabel} disabled={code.length !== 6} />
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted hover:text-foreground">
          <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="text-rb-green-300 hover:underline disabled:opacity-60"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}

function SubmitButton({
  loading,
  label,
  disabled,
  icon: Icon = ArrowRight,
}: {
  loading: boolean;
  label: string;
  disabled?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
        </>
      ) : (
        <>
          {label}
          <Icon className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex items-center gap-1 text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  setShow,
  autoComplete,
  label = "Password",
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  autoComplete?: string;
  label?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-muted">{label}</label>
      <div className="glass-pill flex items-center gap-2 rounded-xl px-3.5">
        <Lock className="h-4 w-4 text-muted" />
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-muted hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  icon: React.ElementType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-muted">{label}</label>
      <div className="glass-pill flex items-center gap-2 rounded-xl px-3.5">
        <Icon className="h-4 w-4 text-muted" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}

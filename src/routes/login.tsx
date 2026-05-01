import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { FirebaseError } from "firebase/app";
import { authService } from "@/services/authService";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, BarChart3, Building2, ShieldCheck, Users } from "lucide-react";
import { promptNotificationPermissionAfterLogin, showNotification } from "@/lib/notifications";
import { useNotificationCenterStore } from "@/store/notification-center-store";
import { ShimmerBox } from "@/components/page-shimmer";
import { cn } from "@/lib/utils";

const loginShellOuterClass =
  "box-border flex h-[100vh] flex-col overflow-hidden overscroll-none bg-background lg:bg-muted/70 dark:lg:bg-muted/25";

const loginShellInnerClass = cn(
  "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background lg:mx-auto lg:max-w-6xl lg:flex-row",
  "lg:border-2 lg:border-border lg:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.1),0_0_0_1px_rgba(15,23,42,0.04)_inset] dark:lg:border-[oklch(1_0_0_/_0.16)] dark:lg:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
);

/** Subtle drifting orbs for login shell (desktop); sits under columns via z-0. */
function LoginDesktopAmbientOrbs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
      aria-hidden
    >
      <div
        className="login-orb-drift-a absolute -left-[32%] top-[-22%] h-[22rem] w-[22rem] rounded-full border border-[color-mix(in_oklab,var(--brand)_14%,transparent)] bg-[color-mix(in_oklab,var(--brand)_5%,transparent)] blur-[1px] xl:h-[26rem] xl:w-[26rem] dark:border-[color-mix(in_oklab,var(--brand)_22%,transparent)] dark:bg-[color-mix(in_oklab,var(--brand)_7%,transparent)]"
      />
      <div
        className="login-orb-drift-b absolute -right-[28%] top-[18%] h-[18rem] w-[18rem] rounded-full border border-border/25 bg-muted/25 xl:h-[21rem] xl:w-[21rem] dark:border-white/10 dark:bg-white/[0.04]"
      />
      <div
        className="login-orb-drift-c absolute -bottom-[18%] left-[5%] h-[16rem] w-[16rem] rounded-full border border-[color-mix(in_oklab,var(--brand-muted-oklch)_22%,transparent)] bg-[color-mix(in_oklab,var(--brand-muted-oklch)_6%,transparent)] xl:h-[19rem] xl:w-[19rem] dark:border-[color-mix(in_oklab,var(--brand-muted-oklch)_30%,transparent)] dark:bg-[color-mix(in_oklab,var(--brand-muted-oklch)_8%,transparent)]"
      />
      <div className="login-orb-drift-a-rev absolute bottom-[12%] -right-[12%] h-[13rem] w-[13rem] rounded-full border border-border/20 bg-background/[0.45] dark:border-white/10 dark:bg-white/[0.03]" />
    </div>
  );
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in - MedCare" },
      { name: "description", content: "Sign in to MedCare clinical platform." },
    ],
  }),
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

function firebaseAuthMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/user-not-found": "Invalid email or password.",
      "auth/wrong-password": "Invalid email or password.",
      "auth/invalid-login-credentials": "Invalid email or password.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/popup-closed-by-user": "Sign-in was cancelled.",
      "auth/popup-blocked": "Pop-up was blocked. Allow pop-ups for this site and try again.",
      "auth/cancelled-popup-request": "Only one sign-in window at a time. Try again.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/operation-not-allowed": "This sign-in method is disabled in Firebase Console.",
      "auth/invalid-api-key": "App configuration error. Check Firebase API key in .env.",
      "auth/unauthorized-domain": "This domain is not authorized. Add it in Firebase Authentication settings.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-token-expired": "Session expired. Sign in again.",
      "auth/requires-recent-login": "For security, sign out and sign in again.",
      "auth/account-exists-with-different-credential":
        "An account already exists with this email using a different sign-in method.",
    };
    return messages[err.code] ?? err.message;
  }
  return err instanceof Error ? err.message : "Authentication failed";
}

function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate({ to: "/dashboard" });
  }, [authLoading, session, navigate]);

  const [mobileWelcomePhase, setMobileWelcomePhase] = useState<"off" | "show" | "fade">("off");
  const mobileWelcomeTimeoutsRef = useRef<number[]>([]);

  const dismissMobileWelcome = useCallback(() => {
    mobileWelcomeTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    mobileWelcomeTimeoutsRef.current = [];
    setMobileWelcomePhase((p) => (p === "off" ? "off" : "fade"));
    const done = window.setTimeout(() => setMobileWelcomePhase("off"), 400);
    mobileWelcomeTimeoutsRef.current.push(done);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const narrow = window.matchMedia("(max-width: 1023px)");
    if (!narrow.matches) return;

    mobileWelcomeTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    mobileWelcomeTimeoutsRef.current = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      mobileWelcomeTimeoutsRef.current.push(id);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setMobileWelcomePhase("show");
      schedule(() => setMobileWelcomePhase("off"), 5000);
      return () => {
        mobileWelcomeTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
        mobileWelcomeTimeoutsRef.current = [];
      };
    }

    setMobileWelcomePhase("show");
    schedule(() => setMobileWelcomePhase("fade"), 4500);
    schedule(() => setMobileWelcomePhase("off"), 5000);
    return () => {
        mobileWelcomeTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      mobileWelcomeTimeoutsRef.current = [];
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const cred = await authService.signInWithEmail(parsed.data.email, parsed.data.password);
      const addr = cred.user.email ?? parsed.data.email;
      useNotificationCenterStore.getState().appendLogin(addr);
      void showNotification("Signed in", { body: `Welcome back, ${addr}.` });
      void promptNotificationPermissionAfterLogin();
    } catch (err) {
      setError(firebaseAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const cred = await authService.signInWithGoogle();
      const addr = cred.user.email ?? "Google user";
      useNotificationCenterStore.getState().appendLogin(addr);
      void showNotification("Signed in", { body: `Welcome back ${addr}.` });
      void promptNotificationPermissionAfterLogin();
    } catch (err) {
      setError(firebaseAuthMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={loginShellOuterClass}>
        <div className={loginShellInnerClass} aria-busy="true" aria-live="polite">
          <LoginDesktopAmbientOrbs />
          <div className="relative z-[1] hidden min-h-0 w-full max-w-xl shrink-0 flex-col gap-6 overflow-hidden border-border/40 bg-white p-8 dark:border-border/35 dark:bg-card lg:flex lg:border-r xl:p-10">
            <div className="flex items-center gap-3">
              <ShimmerBox className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ShimmerBox className="h-4 w-28" />
                <ShimmerBox className="h-3 w-36" />
              </div>
              <ShimmerBox className="hidden h-8 w-24 rounded-full sm:block" />
            </div>
            <div className="space-y-3 pt-2">
              <ShimmerBox className="h-3 w-24" />
              <ShimmerBox className="h-8 w-full max-w-sm" />
              <ShimmerBox className="h-16 w-full max-w-md" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <ShimmerBox className="h-[4.5rem] w-full" />
              <ShimmerBox className="h-[4.5rem] w-full" />
              <ShimmerBox className="h-[4.5rem] w-full" />
            </div>
            <ShimmerBox className="h-3 w-48" />
          </div>

          <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden bg-background px-4 py-6 dark:bg-background lg:bg-muted/35 lg:px-10 lg:py-8 dark:lg:bg-muted/15 xl:px-12">
            <div className="mx-auto w-full max-w-[400px] space-y-5">
              <div className="flex items-center gap-2 lg:hidden">
                <ShimmerBox className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <ShimmerBox className="h-4 w-28" />
                  <ShimmerBox className="h-3 w-36" />
                </div>
              </div>
              <div className="space-y-2">
                <ShimmerBox className="h-6 w-44 sm:h-7" />
                <ShimmerBox className="h-4 w-full" />
              </div>
              <div className="space-y-4 border-t border-border/40 pt-5 dark:border-border/35 lg:border-0 lg:pt-0">
                <ShimmerBox className="h-11 w-full" />
                <ShimmerBox className="h-px w-full opacity-80" />
                <ShimmerBox className="h-3 w-20" />
                <ShimmerBox className="h-11 w-full" />
                <ShimmerBox className="h-3 w-20" />
                <ShimmerBox className="h-11 w-full" />
                <ShimmerBox className="h-11 w-full" />
              </div>
              <ShimmerBox className="mx-auto h-3 w-[85%]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const enterpriseHighlights = [
    {
      icon: Users,
      title: "Unified patient access",
      description: "Role-aware records and census aligned with your organization.",
    },
    {
      icon: BarChart3,
      title: "Operational analytics",
      description: "Real-time operational views for administrators and care teams.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-grade trust",
      description: "HIPAA-aware patterns, audit trails, and session controls.",
    },
    {
      icon: Activity,
      title: "Critical alerting",
      description: "Timely notifications for escalations that need attention.",
    },
  ] as const;

  return (
    <div className={loginShellOuterClass}>
      <div className={loginShellInnerClass}>
        <LoginDesktopAmbientOrbs />
        {mobileWelcomePhase !== "off" ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-welcome-title"
            className={cn(
              "absolute inset-0 z-30 flex flex-col overflow-hidden bg-[oklch(0.21_0.048_252)] text-white transition-opacity duration-500 ease-out lg:hidden dark:bg-[oklch(0.19_0.045_252)]",
              mobileWelcomePhase === "fade" ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            {/* Floating transparent orbs - theme brand tint, not flat gradient fill */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div
                className="login-orb-drift-a absolute -left-[42%] top-[-18%] h-[min(95vw,26rem)] w-[min(95vw,26rem)] rounded-full border border-[color-mix(in_oklab,var(--brand)_28%,transparent)] bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] blur-[1px]"
              />
              <div
                className="login-orb-drift-b absolute -right-[38%] top-[22%] h-[min(78vw,20rem)] w-[min(78vw,20rem)] rounded-full border border-white/12 bg-white/[0.04]"
              />
              <div
                className="login-orb-drift-c absolute -bottom-[20%] left-[10%] h-[min(70vw,18rem)] w-[min(70vw,18rem)] rounded-full border border-[color-mix(in_oklab,var(--brand-muted-oklch)_35%,transparent)] bg-[color-mix(in_oklab,var(--brand-muted-oklch)_8%,transparent)]"
              />
              <div
                className="login-orb-drift-a-rev absolute bottom-[8%] -right-[15%] h-[11rem] w-[11rem] rounded-full border border-white/10 bg-white/[0.03] sm:h-[14rem] sm:w-[14rem]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,transparent_40%,oklch(0.15_0.04_252_/_0.55)_100%)]" />
            </div>

            <div className="relative flex flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-3">
                <img
                  src="/ragaai.jpg"
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/30"
                />
                <div className="min-w-0 leading-tight">
                  <p className="text-sm font-bold tracking-tight">MedCare</p>
                  <p className="text-[11px] text-white/75">Clinical Platform</p>
                </div>
                <span className="ml-auto flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.07] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/95 backdrop-blur-[2px]">
                  <Building2 className="h-3 w-3 opacity-90" aria-hidden />
                  Enterprise
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-muted-oklch)]">
                  Secure access
                </p>
                <h2
                  id="mobile-welcome-title"
                  className="mt-2 text-balance text-2xl font-bold leading-tight tracking-tight sm:text-[1.65rem]"
                >
                  Your hospital workspace
                </h2>
                <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-white/82">
                  Patient records, analytics, and care coordination, with the same trusted MedCare experience as
                  inside the app.
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-left text-sm text-white/88">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--brand-muted-oklch)]" aria-hidden />
                    HIPAA-aware architecture & audit-ready workflows
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 shrink-0 text-[var(--brand-muted-oklch)]" aria-hidden />
                    Real-time operational visibility & alerts
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative border-t border-white/12 bg-[oklch(0.21_0.048_252_/_0.92)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md dark:bg-[oklch(0.19_0.045_252_/_0.92)]">
              <Button
                type="button"
                className="h-11 w-full border-0 bg-white font-semibold text-[oklch(0.27_0.06_255)] shadow-sm hover:bg-white/90"
                onClick={dismissMobileWelcome}
              >
                Sign in now
              </Button>
              <p className="mt-3 text-center text-[11px] text-white/50">Or continue automatically in a few seconds</p>
            </div>
          </div>
        ) : null}

        {/* Brand column - desktop only; avoids stacked mobile height + scrollbars */}
        <div className="relative z-[1] hidden min-h-0 w-full max-w-xl shrink-0 flex-col overflow-hidden border-border/40 bg-white dark:border-border/35 dark:bg-card lg:flex lg:border-r lg:px-10 lg:py-8 xl:px-12 xl:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                "radial-gradient(oklch(0.629 0.181 264.4 / 0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative flex h-full min-h-0 flex-col justify-between">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-3">
                <img
                  src="/ragaai.jpg"
                  alt="MedCare"
                  className="h-12 w-12 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white dark:ring-border"
                />
                <div className="min-w-0 leading-tight">
                  <p className="text-base font-bold tracking-tight text-foreground md:text-lg">MedCare</p>
                  <p className="text-[11px] text-muted-foreground md:text-xs">Clinical Platform</p>
                </div>
                <span className="ml-auto hidden items-center gap-1 rounded-full border border-border/50 bg-muted/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:flex dark:bg-muted/40">
                  <Building2 className="h-3 w-3 opacity-70" aria-hidden />
                  Enterprise
                </span>
              </div>

              <div className="mt-6 space-y-2 xl:mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                  Secure access
                </p>
                <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
                  Sign in to your hospital workspace
                </h1>
                <p className="max-w-md text-pretty text-xs leading-relaxed text-muted-foreground xl:text-sm">
                  Same MedCare experience your teams use inside the product - calm, precise, and built for
                  clinical operations at scale.
                </p>
              </div>

              <ul className="mt-6 hidden min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex">
                {enterpriseHighlights.map(({ icon: Icon, title, description }) => (
                  <li
                    key={title}
                    className="flex min-h-0 gap-3 border border-border/35 bg-muted/25 p-3 dark:border-border/30 dark:bg-muted/20"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] text-[var(--brand)] dark:bg-[color-mix(in_oklab,var(--brand)_18%,transparent)]">
                      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="shrink-0 pt-4 text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} MedCare · v1.0 HIPAA-aware demo
            </p>
          </div>
        </div>

        {/* Form column */}
        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden bg-background px-4 py-6 dark:bg-background lg:bg-muted/35 lg:px-10 lg:py-8 dark:lg:bg-muted/15 xl:px-12">
          <div className="mx-auto w-full max-w-[400px] shrink-0">
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <img
                src="/ragaai.jpg"
                alt="MedCare"
                className="h-10 w-10 rounded-full object-cover shadow-md ring-2 ring-white dark:ring-border"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">MedCare</p>
                <p className="text-[11px] text-muted-foreground">Clinical Platform</p>
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Account sign-in
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Use your work email or Google. Your session respects organizational roles inside the app.
              </p>
            </div>

            <div className="space-y-5 border-t border-border/50 pt-5 dark:border-border/40 lg:border-0 lg:pt-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-border/60 text-sm font-medium shadow-sm"
                disabled={submitting || googleLoading}
                onClick={handleGoogle}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.86 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.96l3.68-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38z"
                  />
                </svg>
                {googleLoading ? "Opening Google…" : "Continue with Google"}
              </Button>

              <div className="my-4 flex items-center gap-3 sm:my-5">
                <div className="h-px flex-1 bg-border/80" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  or email
                </span>
                <div className="h-px flex-1 bg-border/80" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Work email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@hospital.org"
                    className="h-11 border-border/60 bg-background/80"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 border-border/60 bg-background/80"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {(import.meta.env.DEV ||
                  import.meta.env.VITE_SHOW_LOGIN_DEMO_FILL === "true") && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-w-0 flex-1"
                      disabled={submitting || googleLoading}
                      aria-label="Fill admin@careiq.dev and password for local testing"
                      onClick={() => {
                        setEmail("admin@careiq.dev");
                        setPassword("Admin@123");
                        setError(null);
                      }}
                    >
                      Fill admin
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-w-0 flex-1"
                      disabled={submitting || googleLoading}
                      aria-label="Fill clinician@careiq.dev and password for local testing"
                      onClick={() => {
                        setEmail("clinician@careiq.dev");
                        setPassword("Clinic@123");
                        setError(null);
                      }}
                    >
                      Fill clinician
                    </Button>
                  </div>
                )}
                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
                  >
                    {error}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  className="h-11 w-full text-sm font-semibold shadow-[0_2px_8px_-2px_rgba(15,23,42,0.15)]"
                  disabled={submitting || googleLoading}
                >
                  {submitting ? "Signing in…" : "Sign in to MedCare"}
                </Button>
              </form>
            </div>

            <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-[11px]">
              By continuing you acknowledge MedCare&apos;s terms and privacy practices for this demo
              environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

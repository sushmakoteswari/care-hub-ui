import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { FirebaseError } from "firebase/app";
import { authService } from "@/services/authService";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Activity, ShieldCheck, Stethoscope } from "lucide-react";
import { showNotification } from "@/lib/notifications";
import { useNotificationCenterStore } from "@/store/notification-center-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MedCare" },
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
      void showNotification("Signed in", { body: `Welcome back — ${addr}.` });
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
    } catch (err) {
      setError(firebaseAuthMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[image:var(--gradient-hero)] p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MedCare</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            The clinical operating system for modern hospitals.
          </h1>
          <p className="max-w-md text-base text-primary-foreground/80">
            Unified patient records, real-time analytics, and care
            coordination — built for clinicians, designed for trust.
          </p>
          <div className="flex flex-col gap-3 pt-4 text-sm text-primary-foreground/85">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              HIPAA-aware architecture & end-to-end encryption
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Live vitals & critical alerting
            </div>
          </div>
        </div>
        <div className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} MedCare Health Inc.
        </div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-semibold">MedCare</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Enter your details to continue.
          </p>

          <Card className="mt-6 p-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting || googleLoading}
              onClick={handleGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.86 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.96l3.68-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
              </svg>
              {googleLoading ? "Opening Google…" : "Continue with Google"}
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              OR CONTINUE WITH EMAIL
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
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
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || googleLoading}
              >
                {submitting ? "Please wait…" : "Sign in"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            By continuing you agree to MedCare's Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

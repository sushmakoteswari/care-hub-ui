import { useState, useEffect, useMemo, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sparkles, Send, Loader2, X, Stethoscope, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { patients, getPatientById } from "@/data/patients";
import { patientsVisibleToUser } from "@/lib/patient-access";
import { appStore } from "@/store/app-store";
import {
  completeGroq,
  fetchAIPatientFilter,
  fetchNotesSummaryGroq,
  fetchRiskExplanationGroq,
  fetchWardInsight,
  isGroqAvailable,
} from "@/services/groq";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, role } = useAuth();
  const cohort = useMemo(
    () => patientsVisibleToUser(patients, role, user?.email),
    [role, user?.email],
  );

  const segments = pathname.split("/").filter(Boolean);
  const isPatientDetail = segments[0] === "patients" && segments.length === 2;
  const detailId = isPatientDetail ? segments[1] : null;
  const detailPatient = detailId ? getPatientById(detailId) : undefined;
  const isPatientsList = pathname === "/patients" || pathname === "/patients/";

  useEffect(() => {
    void isGroqAvailable().then(setReady);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const push = (role: Msg["role"], content: string) => {
    setMessages((m) => [...m, { id: `${Date.now()}-${Math.random()}`, role, content }]);
  };

  const run = async (userLabel: string, fn: () => Promise<string>) => {
    push("user", userLabel);
    setLoading(true);
    try {
      const out = await fn();
      push("assistant", out);
    } catch (e) {
      push("assistant", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    if (isPatientsList) {
      push("user", text);
      setLoading(true);
      try {
        const ids = await fetchAIPatientFilter(text, cohort);
        const validSet = new Set(cohort.map((p) => p.id));
        const valid = ids.filter((id) => validSet.has(id));
        if (valid.length === 0) {
          push(
            "assistant",
            "No matching patients found, or the model returned IDs not in your current list. Try a simpler query (e.g. “critical patients in cardiology”).",
          );
        } else {
          appStore.setPatientAiFilterIds(valid);
          push(
            "assistant",
            `Filtered to ${valid.length} patient(s). Clear the **Assistant filter** chip on this page when you want the full list again.`,
          );
        }
      } catch (e) {
        push("assistant", e instanceof Error ? e.message : "Smart filter failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    push("user", text);
    setLoading(true);
    try {
      const reply = await completeGroq(
        `You are MedCare's in-app clinical assistant. Be concise and practical. If the user asks for medical advice about a specific patient they have not opened, suggest they open that patient record or use the Patients page smart search.\n\nUser message: ${text}`,
        500,
      );
      push("assistant", reply);
    } catch (e) {
      push("assistant", e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const actionsNeedKey = ready === false;

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close clinical assistant" : "Open clinical assistant"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-white text-[var(--brand)] shadow-[0_8px_28px_-8px_rgba(15,23,42,0.25)] transition-[transform,box-shadow] hover:scale-105 hover:shadow-lg dark:border-border dark:bg-card md:h-14 md:w-14",
          "bottom-20 right-4 md:bottom-6 md:right-6",
        )}
      >
        {open ? (
          <X className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <Sparkles className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2} aria-hidden />
        )}
      </button>

      {open ? (
        <div
          className={cn(
            "fixed z-[60] flex max-h-[min(540px,72vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/50 bg-white/95 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.22)] backdrop-blur-md dark:border-border dark:bg-card/95",
            "bottom-[5.5rem] right-3 md:bottom-24 md:right-6",
          )}
          role="dialog"
          aria-label="Clinical assistant"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 dark:border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] text-[var(--brand)]">
                <Sparkles className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Clinical assistant</p>
                <p className="text-[10px] text-muted-foreground">
                  {ready === null
                    ? "Checking server…"
                    : ready
                      ? "Groq (server)"
                      : "Add GROQ_API_KEY on server to enable replies"}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-border/40 px-3 py-2 dark:border-border/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              disabled={actionsNeedKey || loading || cohort.length === 0}
              onClick={() => void run("Ward briefing from current census", () => fetchWardInsight(cohort))}
            >
              <Activity className="h-3 w-3" /> Ward briefing
            </Button>
            {detailPatient ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  disabled={actionsNeedKey || loading}
                  onClick={() =>
                    void run("Explain risk for this patient", () =>
                      fetchRiskExplanationGroq(detailPatient),
                    )
                  }
                >
                  <Stethoscope className="h-3 w-3" /> Risk
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  disabled={actionsNeedKey || loading}
                  onClick={() =>
                    void run("SOAP-style summary for this patient", () =>
                      fetchNotesSummaryGroq(detailPatient),
                    )
                  }
                >
                  <FileText className="h-3 w-3" /> SOAP
                </Button>
              </>
            ) : null}
          </div>

          <div ref={scrollRef} className="min-h-[12rem] flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                {isPatientsList
                  ? "Use smart search: describe who you want (e.g. “elderly cardiology monitoring”)."
                  : "Use quick actions or type a question."}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-6 bg-accent/12 text-foreground"
                      : "mr-4 bg-muted/80 text-foreground",
                  )}
                >
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              ))
            )}
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t border-border/50 p-3 dark:border-border/60">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder={
                isPatientsList ? "Smart patient search…" : "Ask or use buttons above…"
              }
              disabled={loading}
              autoComplete="off"
              className="pointer-events-auto min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-2 ring-transparent placeholder:text-muted-foreground focus-visible:ring-ring disabled:opacity-60"
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0"
              disabled={loading || !input.trim()}
              onClick={() => void onSend()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

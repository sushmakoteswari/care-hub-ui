import { useEffect, useRef, useCallback, useState } from "react";

const DEFAULT_WARNING_MS = 14 * 60 * 1000;
const DEFAULT_GRACE_MS = 60 * 1000;

type Options = {
  /** Fire when user has been idle this long (default 14 min) */
  warningAfterMs?: number;
  /** After warning, auto sign-out if still inactive (default 60s) */
  gracePeriodMs?: number;
  onWarning: () => void;
  onTimeout: () => void;
  /** When false, timers are cleared */
  enabled: boolean;
  /** When true (e.g. warning modal open), user activity does not reset the idle clock */
  ignoreActivity?: boolean;
};

/**
 * Resets idle clock on common user activity. Triggers onWarning once per idle cycle;
 * if user stays idle through grace, calls onTimeout.
 */
export function useIdleSession({
  warningAfterMs = DEFAULT_WARNING_MS,
  gracePeriodMs = DEFAULT_GRACE_MS,
  onWarning,
  onTimeout,
  enabled,
  ignoreActivity = false,
}: Options) {
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warned = useRef(false);
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);
  onWarningRef.current = onWarning;
  onTimeoutRef.current = onTimeout;

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (graceTimer.current) clearTimeout(graceTimer.current);
    warningTimer.current = null;
    graceTimer.current = null;
  }, []);

  const schedule = useCallback(() => {
    clearTimers();
    warned.current = false;
    if (!enabled) return;
    warningTimer.current = setTimeout(() => {
      warned.current = true;
      onWarningRef.current();
      graceTimer.current = setTimeout(() => {
        onTimeoutRef.current();
      }, gracePeriodMs);
    }, warningAfterMs);
  }, [enabled, warningAfterMs, gracePeriodMs, clearTimers]);

  const resetIdleTimer = useCallback(
    (opts?: { force?: boolean }) => {
      if (!enabled) return;
      if (ignoreActivity && !opts?.force) return;
      if (warned.current) {
        warned.current = false;
        clearTimers();
        schedule();
        return;
      }
      schedule();
    },
    [enabled, ignoreActivity, schedule, clearTimers],
  );

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }
    schedule();
    return () => clearTimers();
  }, [enabled, schedule, clearTimers]);

  useEffect(() => {
    if (!enabled || ignoreActivity) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
    const onAct = () => resetIdleTimer();
    for (const e of events) window.addEventListener(e, onAct, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, onAct);
    };
  }, [enabled, ignoreActivity, resetIdleTimer]);

  return { resetIdleTimer };
}

/** Remaining seconds for UI countdown after warning */
export function useSessionCountdown(active: boolean, startGraceMs: number) {
  const [left, setLeft] = useState(() => Math.ceil(startGraceMs / 1000));
  useEffect(() => {
    if (!active) {
      setLeft(Math.ceil(startGraceMs / 1000));
      return;
    }
    setLeft(Math.ceil(startGraceMs / 1000));
    const t = setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [active, startGraceMs]);
  return left;
}

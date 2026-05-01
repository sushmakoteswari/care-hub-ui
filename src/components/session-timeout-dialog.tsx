import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@tanstack/react-router";
import { useIdleSession, useSessionCountdown } from "@/hooks/use-idle-session";

const GRACE_MS = 60 * 1000;

export function SessionTimeoutDialog() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const skipResetOnClose = useRef(false);

  const handleTimeout = useCallback(async () => {
    skipResetOnClose.current = true;
    setOpen(false);
    await signOut();
    router.navigate({ to: "/login" });
    queueMicrotask(() => {
      skipResetOnClose.current = false;
    });
  }, [signOut, router]);

  const { resetIdleTimer } = useIdleSession({
    enabled: !!session,
    gracePeriodMs: GRACE_MS,
    ignoreActivity: open,
    onWarning: () => setOpen(true),
    onTimeout: handleTimeout,
  });

  const countdown = useSessionCountdown(open, GRACE_MS);

  const staySignedIn = () => {
    setOpen(false);
    resetIdleTimer({ force: true });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
          return;
        }
        setOpen(false);
        if (!skipResetOnClose.current) resetIdleTimer({ force: true });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              You have been idle for 14 minutes. For patient privacy, this session will end
              automatically in <span className="font-semibold text-foreground">{countdown}</span>{" "}
              seconds unless you stay signed in.
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={staySignedIn}>
            Stay signed in
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleTimeout()}>
            Sign out now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

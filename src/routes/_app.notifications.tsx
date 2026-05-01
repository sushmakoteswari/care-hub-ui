import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  useNotificationCenterStore,
  filterNotificationsForUser,
  selectUnreadNotificationCountForViewer,
} from "@/store/notification-center-store";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — MedCare" }],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { role, user } = useAuth();
  const items = useNotificationCenterStore((s) => s.items);
  const markRead = useNotificationCenterStore((s) => s.markRead);
  const markAllReadForViewer = useNotificationCenterStore((s) => s.markAllReadForViewer);

  const visible = useMemo(
    () => filterNotificationsForUser(items, role, user?.email),
    [items, role, user?.email],
  );
  const unread = selectUnreadNotificationCountForViewer(items, role, user?.email);

  const showShimmer = useInitialPageShimmer();
  if (showShimmer) {
    return <NotificationsShimmer />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "admin"
              ? "Organization and patient alerts (demo)."
              : "Alerts for your assigned patients and account activity (demo)."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={unread === 0}
          onClick={() => markAllReadForViewer(role, user?.email)}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No notifications for your role.
          </Card>
        ) : (
          visible.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-colors ${n.read ? "opacity-80" : "border-l-4 border-l-accent"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      {!n.read ? (
                        <Badge variant="secondary" className="text-[10px]">
                          New
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!n.read ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationsShimmer() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-6"
      aria-busy="true"
      aria-label="Loading notifications"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <ShimmerBox className="h-8 w-48" />
          <ShimmerBox className="h-4 w-full max-w-md" />
        </div>
        <ShimmerBox className="h-9 w-36" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <ShimmerBox className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmerBox className="h-4 w-48 max-w-full" />
                <ShimmerBox className="h-3 w-full max-w-lg" />
                <ShimmerBox className="h-3 w-32" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

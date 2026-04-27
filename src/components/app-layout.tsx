import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useAppStore, appStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  BarChart3,
  Bell,
  BellOff,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { type ReactNode } from "react";
import { requestPermission, showNotification } from "@/lib/notifications";

const NAV = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics" as const, label: "Analytics", icon: BarChart3 },
  { to: "/patients" as const, label: "Patients", icon: Users },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const notifEnabled = useAppStore((s) => s.notificationsEnabled);

  const initials = (user?.email ?? "U")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const handleNotifToggle = async () => {
    if (notifEnabled) {
      appStore.setNotificationsEnabled(false);
      return;
    }
    const perm = await requestPermission();
    if (perm === "granted") {
      appStore.setNotificationsEnabled(true);
      showNotification("Notifications enabled", {
        body: "You'll receive critical patient alerts here.",
      });
    } else {
      showNotification("Permission needed", {
        body: "Enable browser notifications in your settings to receive alerts.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">MedCare</div>
            <div className="text-[11px] text-sidebar-foreground/60">Clinical Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-[11px] text-sidebar-foreground/50">
          v1.0 · HIPAA-aware demo
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-semibold">MedCare</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              All systems operational
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotifToggle}
              aria-label="Toggle notifications"
              title={notifEnabled ? "Notifications on" : "Enable notifications"}
            >
              {notifEnabled ? (
                <Bell className="h-4 w-4 text-accent" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">
                    {user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    router.navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-background md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
              activeProps={{
                className:
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-primary font-medium",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 pb-20 md:px-8 md:pb-10">{children}</main>
      </div>
    </div>
  );
}

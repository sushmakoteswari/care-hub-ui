import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useAppStore, appStore } from "@/store/app-store";
import {
  useNotificationCenterStore,
  selectUnreadNotificationCountForViewer,
} from "@/store/notification-center-store";
import { SessionTimeoutDialog } from "@/components/session-timeout-dialog";
import { CommandMenu } from "@/components/command-menu";
import { AiChatbot } from "@/components/ai-chatbot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  Bell,
  BellOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useState, useEffect, useMemo } from "react";
import { requestPermission, showNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/dashboard" | "/analytics" | "/patients" | "/notifications" | "/audit-log";
  label: string;
  /** Single short word for mobile bottom tabs (fits narrow screens without horizontal scroll). */
  tabLabel: string;
  icon: LucideIcon;
};

function navItemsForRole(role: string): NavItem[] {
  const items: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", tabLabel: "Home", icon: LayoutDashboard },
  ];
  if (role === "admin") {
    items.push({ to: "/analytics", label: "Analytics", tabLabel: "Stats", icon: BarChart3 });
  }
  items.push(
    { to: "/patients", label: "Patients", tabLabel: "Patients", icon: Users },
    { to: "/notifications", label: "Notifications", tabLabel: "Inbox", icon: Inbox },
  );
  if (role === "admin") {
    items.push({ to: "/audit-log", label: "Audit log", tabLabel: "Audit", icon: Shield });
  }
  return items;
}

/** Mirrors route titles so nav active state stays bold blue (avoids Link className merge bugs). */
function isNavItemActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
  if (to === "/analytics") return pathname.startsWith("/analytics");
  if (to === "/patients") return pathname.startsWith("/patients");
  if (to === "/notifications") return pathname.startsWith("/notifications");
  if (to === "/audit-log") return pathname.startsWith("/audit-log");
  return false;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const notifEnabled = useAppStore((s) => s.notificationsEnabled);
  const notificationItems = useNotificationCenterStore((s) => s.items);
  const unreadCount = useMemo(
    () =>
      selectUnreadNotificationCountForViewer(notificationItems, role, user?.email),
    [notificationItems, role, user?.email],
  );
  const navItems = useMemo(() => navItemsForRole(role), [role]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("medcare-sidebar-expanded");
    if (stored === "0") setSidebarExpanded(false);
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((e) => {
      const next = !e;
      localStorage.setItem("medcare-sidebar-expanded", next ? "1" : "0");
      return next;
    });
  };

  /** Warm the Analytics JS chunk (Recharts is large) so first open rarely stalls. */
  useEffect(() => {
    if (role !== "admin") return;
    void import("@/routes/_app.analytics").catch(() => {});
  }, [role]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { NavIcon, navTitle, navSubtitle } = useMemo(() => {
    if (pathname.startsWith("/dashboard") || pathname === "/")
      return { NavIcon: LayoutDashboard, navTitle: "Dashboard", navSubtitle: "MedCare · Clinical Platform" };
    if (pathname.startsWith("/analytics"))
      return { NavIcon: BarChart3, navTitle: "Analytics", navSubtitle: "MedCare · Clinical Platform" };
    if (pathname.startsWith("/patients/") && pathname !== "/patients")
      return { NavIcon: Users, navTitle: "Patient record", navSubtitle: "MedCare · Clinical Platform" };
    if (pathname.startsWith("/patients"))
      return { NavIcon: Users, navTitle: "Patients", navSubtitle: "MedCare · Clinical Platform" };
    if (pathname.startsWith("/notifications"))
      return { NavIcon: Inbox, navTitle: "Notifications", navSubtitle: "MedCare · Clinical Platform" };
    if (pathname.startsWith("/audit-log"))
      return { NavIcon: Shield, navTitle: "Audit log", navSubtitle: "MedCare · Clinical Platform" };
    return { NavIcon: LayoutDashboard, navTitle: "MedCare", navSubtitle: "Clinical Platform" };
  }, [pathname]);

  const initials = (user?.email ?? "U").split("@")[0].slice(0, 2).toUpperCase();
  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "clinician"
        ? "Clinician"
        : role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

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
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-muted/70 md:flex-row dark:bg-muted/25">
      <CommandMenu />
      <SessionTimeoutDialog />
      <AiChatbot />

      {/* Sidebar: full height, brand + nav (md+) */}
      <aside
        className={cn(
          "relative z-20 hidden h-svh min-h-0 shrink-0 flex-col border-r border-border/45 bg-white shadow-[1px_0_28px_-12px_rgba(15,23,42,0.12)] transition-[width] duration-200 ease-out dark:border-border/35 dark:bg-card dark:shadow-none md:flex",
          sidebarExpanded ? "w-64" : "w-[4.5rem]",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-border/50 px-2 py-5 dark:border-border/40",
            sidebarExpanded ? "justify-start gap-3 px-3" : "justify-center",
          )}
        >
          <Link
            to="/dashboard"
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
              sidebarExpanded ? "flex-1" : "justify-center",
            )}
            title="MedCare home"
          >
            <img
              src="/ragaai.jpg"
              alt="MedCare"
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white dark:ring-border"
            />
            {sidebarExpanded ? (
              <span className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base lg:text-lg">
                MedCare
              </span>
            ) : null}
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-[5.85rem] left-full z-40 h-8 w-8 -translate-x-1/2 rounded-full border border-border/50 bg-white text-foreground shadow-[0_2px_14px_-2px_rgba(15,23,42,0.2),0_1px_3px_rgba(15,23,42,0.08)] transition-[color,box-shadow,transform] hover:bg-muted/90 hover:text-foreground hover:shadow-[0_3px_16px_-2px_rgba(15,23,42,0.22)] dark:border-border/60 dark:bg-card dark:text-foreground dark:shadow-[0_2px_14px_-2px_rgba(0,0,0,0.45)] dark:hover:bg-muted",
          )}
          onClick={toggleSidebar}
          aria-expanded={sidebarExpanded}
          aria-label={sidebarExpanded ? "Collapse navigation" : "Expand navigation"}
        >
          {sidebarExpanded ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          )}
        </Button>
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-5 md:pt-6">
          {navItems.map(({ to, label, icon: Icon }) => {
            const navActive = isNavItemActive(pathname, to);
            return (
              <Link
                key={to}
                to={to}
                title={!sidebarExpanded ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2.5 text-sm transition-colors",
                  sidebarExpanded ? "gap-3 px-3" : "justify-center px-2",
                  navActive
                    ? "bg-[color-mix(in_oklab,var(--brand)_16%,transparent)] font-bold text-[var(--brand)] shadow-[inset_3px_0_0_0_var(--brand)] dark:bg-[color-mix(in_oklab,var(--brand)_22%,transparent)]"
                    : "text-muted-foreground hover:bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] hover:text-[var(--brand)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {sidebarExpanded ? <span className="truncate">{label}</span> : null}
              </Link>
            );
          })}
        </nav>
        {sidebarExpanded ? (
          <div className="mt-auto shrink-0 border-t border-border/50 p-4 text-[11px] text-muted-foreground/90 dark:border-border/40">
            v1.0 · HIPAA-aware demo
          </div>
        ) : null}
      </aside>

      {/* Main column: canvas + floated navbar - no right padding so the main scrollbar sits flush with the viewport */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-3 pb-3 pl-3 md:pt-4 md:pb-4 md:pl-2 pr-0">
        <header className="z-40 mr-3 flex min-h-14 shrink-0 items-center justify-between gap-3 rounded-2xl border border-border/40 bg-white/92 px-4 py-2.5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18),0_2px_8px_-4px_rgba(15,23,42,0.08)] backdrop-blur-xl md:mr-5 md:min-h-[3.75rem] md:px-6 dark:border-border/50 dark:bg-card/92 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)]">
          <div
            key={pathname}
            className="flex min-w-0 flex-1 animate-in fade-in-0 items-center gap-3 duration-200 md:max-w-[min(24rem,40vw)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] text-[var(--brand)] dark:bg-[color-mix(in_oklab,var(--brand)_18%,transparent)]">
              <NavIcon className="h-5 w-5" aria-hidden strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-base font-bold tracking-tight text-foreground md:text-lg">
                {navTitle}
              </h1>
              <p className="truncate text-[11px] text-muted-foreground md:text-xs">{navSubtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link
                to="/notifications"
                aria-label="Open notifications center"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px] leading-none"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                ) : null}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
                    <span className="max-w-[11rem] truncate text-sm font-medium leading-tight">
                      {user?.email}
                    </span>
                    <span className="max-w-[11rem] truncate text-xs text-muted-foreground">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {roleLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    void handleNotifToggle();
                  }}
                >
                  {notifEnabled ? (
                    <Bell className="mr-2 h-4 w-4 text-accent" />
                  ) : (
                    <BellOff className="mr-2 h-4 w-4" />
                  )}
                  Browser alerts {notifEnabled ? "on" : "off"}
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

        <main className="mt-5 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden scroll-pt-4 md:mt-6">
          <div className="max-w-[100vw] px-4 pb-24 pt-4 md:max-w-none md:px-6 md:pb-10 md:pl-7 md:pr-6 md:pt-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav: equal flex columns, no min-width - avoids sideways scroll on Patients and other routes */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex w-full max-w-[100vw] gap-0 border-t border-border bg-background/95 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 md:hidden"
      >
        {navItems.map(({ to, label, tabLabel, icon: Icon }) => {
          const navActive = isNavItemActive(pathname, to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                "flex min-h-12 min-w-0 flex-1 basis-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-[10px] font-medium leading-none transition-colors",
                navActive
                  ? "bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] font-bold text-[var(--brand)]"
                  : "text-muted-foreground active:bg-muted/80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="max-w-full truncate text-center">{tabLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

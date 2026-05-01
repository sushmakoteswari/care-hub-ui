import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (
    path: "/dashboard" | "/patients" | "/analytics" | "/notifications" | "/audit-log",
  ) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="text-muted-foreground" />
            Dashboard
          </CommandItem>
          {isAdmin ? (
            <CommandItem onSelect={() => go("/analytics")}>
              <BarChart3 className="text-muted-foreground" />
              Analytics
            </CommandItem>
          ) : null}
          <CommandItem onSelect={() => go("/patients")}>
            <Users className="text-muted-foreground" />
            Patients
          </CommandItem>
          <CommandItem onSelect={() => go("/notifications")}>
            <Bell className="text-muted-foreground" />
            Notifications center
          </CommandItem>
          {isAdmin ? (
            <CommandItem onSelect={() => go("/audit-log")}>
              <Shield className="text-muted-foreground" />
              Audit log (admin)
            </CommandItem>
          ) : null}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="This app">
          <CommandItem disabled>
            <Search className="text-muted-foreground" />
            Patient search uses the Patients page filter
          </CommandItem>
          <CommandItem disabled>
            <FileText className="text-muted-foreground" />
            PHI masking: Patients toolbar
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppGuard,
});

function AppGuard() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

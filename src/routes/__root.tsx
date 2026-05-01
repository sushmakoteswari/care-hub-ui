import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { registerServiceWorker } from "@/lib/notifications";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MedCare — B2B Healthcare Platform" },
      {
        name: "description",
        content:
          "MedCare is a clinical SaaS for hospitals: patient records, real-time analytics, and care coordination.",
      },
      { property: "og:title", content: "MedCare — B2B Healthcare Platform" },
      {
        property: "og:description",
        content: "Clinical SaaS for modern hospitals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "MedCare — B2B Healthcare Platform" },
      { name: "description", content: "A B2B healthcare SaaS UI application for managing patient data and analytics." },
      { property: "og:description", content: "A B2B healthcare SaaS UI application for managing patient data and analytics." },
      { name: "twitter:description", content: "A B2B healthcare SaaS UI application for managing patient data and analytics." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3a3dabb5-5a76-4fee-b283-372da3424d84/id-preview-400ff6e9--d37de33f-c4d2-4fd1-8d15-dbaaa66a4b1f.lovable.app-1777315645210.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3a3dabb5-5a76-4fee-b283-372da3424d84/id-preview-400ff6e9--d37de33f-c4d2-4fd1-8d15-dbaaa66a4b1f.lovable.app-1777315645210.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: "/ragaai.jpg" },
      { rel: "apple-touch-icon", href: "/ragaai.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

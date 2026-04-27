/**
 * Notification helper — uses the browser Notification API for in-app/local
 * notifications (works in preview), and registers a service worker only on
 * production hosts (skips Lovable preview iframe).
 */
import { toast } from "sonner";

export function isProdHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h.includes("id-preview--")) return false;
  if (h.includes("lovableproject.com")) return false;
  if (h === "localhost" || h === "127.0.0.1") return false;
  return true;
}

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

export async function showNotification(title: string, opts?: NotificationOptions) {
  // Always show an in-app toast as a guaranteed fallback
  toast(title, { description: opts?.body });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Prefer service worker registration when available (richer features)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, { icon: "/favicon.ico", badge: "/favicon.ico", ...opts });
        return;
      }
    } catch {
      // fall through to plain Notification
    }
  }
  try {
    new Notification(title, { icon: "/favicon.ico", ...opts });
  } catch {
    // ignore
  }
}

/**
 * Register the service worker — but ONLY on production hosts and outside iframes.
 * In preview/iframe we proactively unregister any leftover SW to avoid stale caches.
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!isProdHost() || inIframe()) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    } catch {
      // ignore
    }
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.warn("SW registration failed", err);
  }
}

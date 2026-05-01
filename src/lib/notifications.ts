/**
 * Browser notifications + optional service worker (`/sw.js`).
 * SW registers on production hosts, or on localhost when
 * `VITE_REGISTER_SERVICE_WORKER=true`. Skips iframes and Lovable preview hosts.
 */
import { toast } from "sonner";
import { appStore } from "@/store/app-store";

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isPreviewHost(): boolean {
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com");
}

function isLocalhost(): boolean {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/** True when we should register `/sw.js` (not when we should only unregister). */
export function shouldRegisterServiceWorker(): boolean {
  if (typeof window === "undefined") return false;
  if (inIframe()) return false;
  if (isPreviewHost()) return false;
  if (isLocalhost()) {
    return import.meta.env.VITE_REGISTER_SERVICE_WORKER === "true";
  }
  return true;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

/**
 * After successful sign-in: sync in-app pref if already allowed; otherwise prompt once (default).
 * Skips when permission was permanently denied. Call from login while still tied to user gesture when possible.
 */
export async function promptNotificationPermissionAfterLogin(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    appStore.setNotificationsEnabled(true);
    return;
  }
  if (Notification.permission === "denied") return;
  const perm = await requestPermission();
  if (perm === "granted") appStore.setNotificationsEnabled(true);
}

export async function showNotification(title: string, opts?: NotificationOptions) {
  toast(title, { description: opts?.body });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, { icon: "/ragaai.jpg", badge: "/ragaai.jpg", ...opts });
        return;
      }
    } catch {
      // fall through to plain Notification
    }
  }
  try {
    new Notification(title, { icon: "/ragaai.jpg", ...opts });
  } catch {
    // ignore
  }
}

/**
 * Register the service worker when `shouldRegisterServiceWorker()` is true; otherwise
 * unregister any existing registrations (avoids stale caches in dev/preview).
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!shouldRegisterServiceWorker()) {
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

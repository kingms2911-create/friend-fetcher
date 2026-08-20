/**
 * Web Push / FCM hook logic.
 *
 * Browser Notification + Service Worker push subscription. When
 * VITE_FCM_VAPID_KEY is configured the subscription is created with that
 * application server key so it can be forwarded to Firebase Cloud Messaging.
 */

const VAPID_KEY = (import.meta.env['VITE_FCM_VAPID_KEY'] as string | undefined) ?? "";

export type PushStatus = "unsupported" | "granted" | "denied" | "default";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushStatus(): PushStatus {
  if (!pushSupported()) return "unsupported";
  return Notification.permission as PushStatus;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Ask for permission and, when possible, register a push subscription. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission as PushStatus;

  try {
    if ("serviceWorker" in navigator && VAPID_KEY) {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (!existing) {
        await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
        });
      }
    }
  } catch {
    /* subscription is best-effort — in-app notifications still work */
  }
  return "granted";
}

/** Show a native notification for a freshly received in-app alert. */
export function pushNotify(title: string, body: string): void {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png" });
  } catch {
    /* ignore */
  }
}

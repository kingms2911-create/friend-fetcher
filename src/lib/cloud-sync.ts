/**
 * Client-side cloud persistence for the Kool Fit AI store.
 *
 * The database is no longer reachable from the browser: every read/write goes
 * through authenticated server functions, so app data (accounts, health
 * reports, logs, leads…) is never exposed to anonymous visitors.
 */
import { cloudAuthenticate, cloudLoad, cloudSave } from "./cloud.functions";

type AnyRec = Record<string, unknown>;

export type CloudSnapshot = {
  users: AnyRec[];
  gyms: AnyRec[];
  requests: AnyRec[];
  leads: AnyRec[];
  checkins: AnyRec[];
  notifications: AnyRec[];
  healthIssues: AnyRec[];
  products: AnyRec[];
  workoutChecklist: AnyRec[];
  dietChecklist: AnyRec[];
};

const TOKEN_KEY = "koolfit-session";

export function getSessionToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function setSessionToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  setSessionToken("");
}

const REQUEST_TIMEOUT_MS = 15_000;

class TimeoutError extends Error {}

/** Reject after `ms` so a stalled request can never hang the UI forever. */
function withTimeout<T>(work: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError("timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One retry for transient network/timeout failures; auth errors are never retried. */
async function callServer<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(work());
  } catch (first) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) throw first;
    await sleep(600);
    return withTimeout(work());
  }
}

/** Turns a thrown transport error into a message worth showing to a person. */
export function describeNetworkError(error: unknown): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Check your connection and try again.";
  }
  if (error instanceof TimeoutError) {
    return "The server took too long to respond. Please try again.";
  }
  const status = (error as { status?: number } | null)?.status;
  if (status === 401 || status === 403) {
    return "Your session expired or was blocked. Please reload the page and sign in again.";
  }
  if (typeof status === "number" && status >= 500) {
    return "The server hit an error. Please try again in a moment.";
  }
  const message = error instanceof Error ? error.message : "";
  return message
    ? `Couldn't reach the server: ${message}`
    : "Couldn't reach the server. Please try again.";
}

/** Verify credentials on the server (or register a new account) and store the session. */
export async function cloudSignIn(v: {
  email: string;
  passwordHash: string;
  allowCreate?: boolean | undefined;
  userId?: string | undefined;
}): Promise<{ ok: boolean; error?: string | undefined; userId?: string; mustReset?: boolean }> {
  try {
    const res = await callServer(() =>
      cloudAuthenticate({
        data: {
          email: v.email,
          passwordHash: v.passwordHash,
          allowCreate: v.allowCreate ?? false,
          userId: v.userId ?? "",
        },
      }),
    );
    if (res.ok) setSessionToken(res.token);
    return { ok: res.ok, error: res.error || undefined, userId: res.userId, mustReset: res.mustReset };
  } catch (error) {
    console.error("[cloudSignIn] request failed", error);
    return { ok: false, error: describeNetworkError(error) };
  }
}


/** Pull everything back out of the database. Returns null when signed out / offline. */
export async function loadCloudSnapshot(): Promise<CloudSnapshot | null> {
  const token = getSessionToken();
  if (!token) return null;
  try {
    const json = await cloudLoad({ data: { token } });
    return json ? (JSON.parse(json) as CloudSnapshot) : null;
  } catch {
    return null;
  }
}

/** Push the full state to the database. Safe to call often (debounced by caller). */
export async function saveCloudSnapshot(snapshot: CloudSnapshot): Promise<void> {
  const token = getSessionToken();
  if (!token) return;
  try {
    await cloudSave({ data: { token, snapshot: JSON.stringify(snapshot) } });
  } catch {
    /* offline — local cache keeps the app usable */
  }
}

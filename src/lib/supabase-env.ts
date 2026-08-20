/**
 * Browser-side backend configuration checks.
 *
 * The generated Supabase client throws when its env vars are missing, which
 * would crash the whole app on first render. These helpers let the UI degrade
 * gracefully (and show a clear toast) instead.
 */

type Env = Record<string, string | undefined>;

const env = (import.meta.env ?? {}) as unknown as Env;

/** Public backend URL, with the usual Vite naming fallbacks. */
export const SUPABASE_URL =
  env['VITE_SUPABASE_URL'] ?? env['SUPABASE_URL'] ?? '';

/** Publishable / anon key — either naming convention is accepted. */
export const SUPABASE_ANON_KEY =
  env['VITE_SUPABASE_ANON_KEY'] ??
  env['VITE_SUPABASE_PUBLISHABLE_KEY'] ??
  env['SUPABASE_PUBLISHABLE_KEY'] ??
  '';

/** True when the browser has everything it needs to reach the backend. */
export function isBackendConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function missingBackendVars(): string[] {
  return [
    ...(SUPABASE_URL ? [] : ['VITE_SUPABASE_URL']),
    ...(SUPABASE_ANON_KEY ? [] : ['VITE_SUPABASE_ANON_KEY']),
  ];
}

/**
 * Lazily returns the generated Supabase browser client, or `null` when the
 * keys have not been injected yet — never throws.
 */
export async function getSupabaseClient() {
  if (!isBackendConfigured()) {
    console.warn(
      `[backend] Missing env var(s): ${missingBackendVars().join(', ')} — skipping direct client use.`,
    );
    return null;
  }
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    return supabase;
  } catch (error) {
    console.error('[backend] Could not initialise the Supabase client', error);
    return null;
  }
}

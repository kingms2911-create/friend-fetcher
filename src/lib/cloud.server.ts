/**
 * Server-only cloud persistence for Kool Fit AI.
 *
 * The browser can no longer talk to the database directly (all tables are
 * locked to the service role). Every read/write goes through these helpers,
 * which require a signed session token issued after a credential check.
 */
import { createHmac, timingSafeEqual } from "crypto";

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

const str = (v: unknown) => (typeof v === "string" ? v : null);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function secret() {
  const s = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_URL"];
  if (!s) throw new Error("Server not configured");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueToken(userId: string) {
  const payload = `${userId}.${Date.now() + TOKEN_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the user id when the token is valid and unexpired, otherwise null. */
export function verifyToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, mac] = parts;
  const expected = sign(`${userId}.${exp}`);
  const a = Buffer.from(mac ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!Number(exp) || Number(exp) < Date.now()) return null;
  return userId ?? null;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

/**
 * Verify credentials (password hash produced by the client) and hand back a
 * session token. When `allowCreate` is set and the email is unknown, the
 * account row is created — used by gym registration / member sign-up.
 */
export async function authenticate(input: {
  email: string;
  passwordHash: string;
  allowCreate?: boolean | undefined;
  userId?: string | undefined;
}): Promise<{ ok: boolean; error?: string; token?: string; userId?: string; mustReset?: boolean }> {
  const db = await admin();
  const email = input.email.trim().toLowerCase();
  if (!email || !input.passwordHash) return { ok: false, error: "Invalid email or password" };

  const { data } = await db
    .from("app_users")
    .select("id,email,password_hash,data")
    .ilike("email", email)
    .limit(1);
  const row = (data ?? [])[0];

  if (row) {
    if (row.password_hash !== input.passwordHash) return { ok: false, error: "Invalid email or password" };
    return {
      ok: true,
      token: issueToken(row.id),
      userId: row.id,
      mustReset: Boolean((row.data as AnyRec | null)?.["mustResetPassword"]),
    };
  }

  if (!input.allowCreate || !input.userId) return { ok: false, error: "Invalid email or password" };

  const { error } = await db.from("app_users").insert({
    id: input.userId,
    email,
    role: "pending",
    password_hash: input.passwordHash,
    data: {},
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Could not create the account" };
  return { ok: true, token: issueToken(input.userId), userId: input.userId };
}

/** Full snapshot for an authenticated session. Password hashes are never returned. */
export async function readSnapshot(token: string): Promise<CloudSnapshot | null> {
  if (!verifyToken(token)) return null;
  const db = await admin();

  const [users, gyms, requests, leads, checkins, notifications, issues, products, foodLogs, meta] =
    await Promise.all([
      db.from("app_users").select("id,email,role,gym_id,data"),
      db.from("gyms").select("id,data"),
      db.from("plan_requests").select("id,data"),
      db.from("leads").select("id,data"),
      db.from("checkins").select("id,data"),
      db.from("notifications").select("id,data"),
      db.from("health_issues").select("id,data"),
      db.from("products").select("id,data"),
      db.from("food_logs").select("id,member_id,data"),
      db.from("app_meta").select("key,data"),
    ]);

  if (users.error || !users.data || users.data.length === 0) return null;

  const logsByMember = new Map<string, AnyRec[]>();
  for (const row of foodLogs.data ?? []) {
    const memberId = str(row.member_id);
    if (!memberId) continue;
    const list = logsByMember.get(memberId) ?? [];
    list.push({ ...(row.data as AnyRec), id: row.id });
    logsByMember.set(memberId, list);
  }

  const rows = (r: { data: { id: string; data: unknown }[] | null }) =>
    (r.data ?? []).map((x) => ({ ...(x.data as AnyRec), id: x.id }));

  const metaRow = (key: string) =>
    ((meta.data ?? []).find((m: AnyRec) => m["key"] === key)?.data as { items?: AnyRec[] } | undefined)?.items ?? [];

  return {
    users: users.data.map((u: AnyRec) => ({
      ...(u["data"] as AnyRec),
      id: u["id"],
      email: u["email"] ?? "",
      role: u["role"],
      ...(u["gym_id"] ? { gymId: u["gym_id"] } : {}),
      password: "",
      foodLog: logsByMember.get(String(u["id"])) ?? [],
    })),
    gyms: rows(gyms),
    requests: rows(requests),
    leads: rows(leads),
    checkins: rows(checkins),
    notifications: rows(notifications),
    healthIssues: rows(issues),
    products: rows(products),
    workoutChecklist: metaRow("workoutChecklist"),
    dietChecklist: metaRow("dietChecklist"),
  };
}

async function syncTable(db: AnyRec, table: string, rows: AnyRec[], idKey = "id") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = db as any;
  if (rows.length) await client.from(table).upsert(rows, { onConflict: idKey });
  const ids = rows.map((r) => String(r[idKey]));
  const query = client.from(table).delete();
  await (ids.length ? query.not(idKey, "in", `(${ids.join(",")})`) : query.neq(idKey, "__none__"));
}

/**
 * Persist the app state for an authenticated session.
 * Credentials and roles of *other* accounts are never taken from the client,
 * and account rows are never deleted through this path.
 */
export async function writeSnapshot(token: string, snapshot: CloudSnapshot): Promise<boolean> {
  const callerId = verifyToken(token);
  if (!callerId) return false;
  const db = await admin();

  const { data: existing } = await db.from("app_users").select("id,role,gym_id,password_hash");
  const byId = new Map<string, AnyRec>((existing ?? []).map((r: AnyRec) => [String(r["id"]), r]));
  const callerRole = String(byId.get(callerId)?.["role"] ?? "");
  const isAdminRole = callerRole === "super_admin" || callerRole === "gym_owner" || callerRole === "trainer";

  const foodLogRows: AnyRec[] = [];
  const userRows = snapshot.users.map((u) => {
    const { password, foodLog, ...rest } = u as AnyRec & { password?: string; foodLog?: AnyRec[] };
    const id = String(u["id"]);
    for (const entry of foodLog ?? []) {
      foodLogRows.push({ id: String(entry["id"]), member_id: id, data: entry });
    }
    const prev = byId.get(id);
    const requestedRole = str(u["role"]);
    return {
      id,
      email: str(u["email"]) ?? "",
      // only the caller may change their own password; new rows may set an initial one
      password_hash: prev
        ? id === callerId
          ? (password ?? "") || String(prev["password_hash"] ?? "")
          : String(prev["password_hash"] ?? "")
        : (password ?? ""),
      // roles of existing accounts can only be changed by gym staff / platform admins
      role: prev && !isAdminRole ? prev["role"] : requestedRole === "super_admin" && !prev ? "member" : requestedRole,
      gym_id: prev && !isAdminRole ? prev["gym_id"] : str(u["gymId"]),
      data: rest,
      updated_at: new Date().toISOString(),
    };
  });

  const simple = (rows: AnyRec[], extra: (r: AnyRec) => AnyRec = () => ({})) =>
    rows.map((r) => ({ id: String(r["id"]), data: r, ...extra(r) }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = db as any;
  await Promise.all([
    userRows.length ? client.from("app_users").upsert(userRows, { onConflict: "id" }) : Promise.resolve(),
    syncTable(db, "food_logs", foodLogRows),
    syncTable(db, "gyms", simple(snapshot.gyms)),
    syncTable(db, "plan_requests", simple(snapshot.requests, (r) => ({ member_id: str(r["memberId"]), gym_id: str(r["gymId"]), status: str(r["status"]) }))),
    syncTable(db, "leads", simple(snapshot.leads, (r) => ({ gym_id: str(r["gymId"]), status: str(r["status"]) }))),
    syncTable(db, "checkins", simple(snapshot.checkins, (r) => ({ member_id: str(r["memberId"]), gym_id: str(r["gymId"]) }))),
    syncTable(db, "notifications", simple(snapshot.notifications, (r) => ({ user_id: str(r["userId"]) }))),
    syncTable(db, "health_issues", simple(snapshot.healthIssues, (r) => ({ member_id: str(r["memberId"]), gym_id: str(r["gymId"]) }))),
    syncTable(db, "products", simple(snapshot.products, (r) => ({ scope: str(r["scope"]), gym_id: str(r["gymId"]) }))),
    client.from("app_meta").upsert(
      [
        { key: "workoutChecklist", data: { items: snapshot.workoutChecklist } },
        { key: "dietChecklist", data: { items: snapshot.dietChecklist } },
      ],
      { onConflict: "key" },
    ),
  ]);

  return true;
}

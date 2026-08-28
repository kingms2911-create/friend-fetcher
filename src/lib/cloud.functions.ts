import { createServerFn } from "@tanstack/react-start";

export const cloudAuthenticate = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; passwordHash: string; allowCreate?: boolean; userId?: string }) => ({
    email: String(data?.email ?? "").slice(0, 200),
    passwordHash: String(data?.passwordHash ?? "").slice(0, 200),
    allowCreate: Boolean(data?.allowCreate),
    userId: String(data?.userId ?? "").slice(0, 80),
  }))
  .handler(async ({ data }) => {
    const { authenticate } = await import("./cloud.server");
    const res = await authenticate({ ...data, userId: data.userId || undefined });
    return {
      ok: res.ok,
      error: res.error ?? "",
      token: res.token ?? "",
      userId: res.userId ?? "",
      mustReset: Boolean(res.mustReset),
    };
  });

/** Returns the snapshot as a JSON string ("" when unauthenticated / empty). */
export const cloudLoad = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: String(data?.token ?? "").slice(0, 400) }))
  .handler(async ({ data }) => {
    const { readSnapshot } = await import("./cloud.server");
    const snap = await readSnapshot(data.token);
    return snap ? JSON.stringify(snap) : "";
  });

export const cloudSave = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; snapshot: string }) => ({
    token: String(data?.token ?? "").slice(0, 400),
    snapshot: String(data?.snapshot ?? ""),
  }))
  .handler(async ({ data }) => {
    const { writeSnapshot } = await import("./cloud.server");
    if (!data.snapshot) return false;
    return writeSnapshot(data.token, JSON.parse(data.snapshot));
  });

export const cloudRecoverPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; phone: string; passwordHash: string }) => ({
    email: String(data?.email ?? "").slice(0, 200),
    phone: String(data?.phone ?? "").slice(0, 40),
    passwordHash: String(data?.passwordHash ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { recoverPassword } = await import("./cloud.server");
    const res = await recoverPassword(data);
    return { ok: res.ok, error: res.error ?? "" };
  });

export const cloudChangeUserEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; userId: string; email: string }) => ({
    token: String(data?.token ?? "").slice(0, 400),
    userId: String(data?.userId ?? "").slice(0, 80),
    email: String(data?.email ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { changeUserEmail } = await import("./cloud.server");
    const res = await changeUserEmail(data.token, data.userId, data.email);
    return { ok: res.ok, error: res.error ?? "" };
  });

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { buildPlan } from "./diet-engine";
import { hashPassword } from "./hash";
import { clearSession, cloudSignIn, loadCloudSnapshot, saveCloudSnapshot } from "./cloud-sync";

export type Role = "super_admin" | "gym_owner" | "trainer" | "member";

/** Default password for accounts created by an owner / trainer. */
export const DEFAULT_PASSWORD = "member123";

/** Hardcoded platform super-admin credentials. */
export const SUPER_ADMIN_EMAIL = "admin@fitlygym.com";
export const SUPER_ADMIN_PASSWORD = "SuperAdmin@123";


export type Pricing = { m1: number; m2: number; m3: number };

export const DEFAULT_PRICING: Pricing = { m1: 1500, m2: 2800, m3: 3900 };

export type Gym = {
  id: string;
  name: string;
  slug: string;
  code: string;
  ownerId: string;
  plan: string;
  mrr: number;
  pricing?: Pricing;
  /** contact + location details shown to members */
  ownerPhone?: string;
  trainerPhone?: string;
  ownerWhatsapp?: string;
  trainerWhatsapp?: string;
  timings?: string;
  address?: string;
  /** platform subscription toggle controlled by the super admin */
  active?: boolean;
};

/** Contact numbers the owner configures; members' quick actions bind to these. */
export type GymContacts = {
  ownerPhone: string;
  trainerPhone: string;
  ownerWhatsapp: string;
  trainerWhatsapp: string;
  timings: string;
  address: string;
};


export type Subscription = {
  plan: string;
  status: "active" | "expiring" | "expired";
  amount: number;
  renewsOn: string;
  months?: number;
  startDate?: string;
  expiryDate?: string;
};

export type MemberStatus = "active" | "pending_approval";
export type PaymentStatus = "paid" | "unpaid";
export type PaymentMethod = "online" | "gym";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | undefined;
  password: string;
  role: Role;
  gymId?: string;
  /** true when the account was created by an owner/front-desk with the default password */
  ownerCreated: boolean;
  mustResetPassword: boolean;
  trainerId?: string | undefined;
  joinedAt: string;
  subscription?: Subscription;
  streak?: number;
  attendanceToday?: boolean;
  /** members only — dashboard access is blocked until this is "active" */
  status?: MemberStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  /** plan length the member picked at sign-up, granted on approval */
  requestedMonths?: 1 | 2 | 3;
  /** member asked to renew at the front desk and is waiting for the owner */
  renewalPending?: boolean;
  /** plan assigned by the owner / trainer */
  assignedPlan?: AssignedPlan;
  /** daily calorie goal used by the diet generator + dashboard tracker */
  calorieTarget?: number;
  /** today's logged consumption */
  foodLog?: FoodLogEntry[];
};

export type FoodLogEntry = {
  id: string;
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  at: string;
};


export type AssignedPlan = {
  goal: string;
  assignedAt: string;
  workout: PlanExercise[];
  diet: PlanMeal[];
};

export type LeadStatus = "new" | "contacted" | "joined" | "lost";

export type Lead = {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  note: string;
  status: LeadStatus;
  createdAt: string;
};

export type CheckIn = { id: string; memberId: string; gymId: string; at: string };

/** Affiliate store product. Global products are added by the super admin and
 *  visible to every member; gym products are scoped to one gym code. */
export type Product = {
  id: string;
  scope: "global" | "gym";
  /** set only when scope === "gym" */
  gymId?: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  link: string;
  note: string;
  createdAt: string;
};


/** Gym codes compare case-insensitively and ignore surrounding whitespace. */
export const normalizeGymCode = (code: string) => code.replace(/\s+/g, "").toUpperCase();

/** Members who chose "Pay at Gym" wait for owner approval before any access. */
export function isPendingApproval(user: User | null): boolean {
  if (!user || user.role !== "member") return false;
  return user.status === "pending_approval";
}

/** Hard lock rule: expired status or a past expiry date locks the member out. */
export function isMembershipExpired(user: User | null): boolean {
  if (!user || user.role !== "member") return false;
  if (user.status === "pending_approval") return false;
  const sub = user.subscription;
  if (!sub) return true;
  if (sub.status === "expired") return true;
  const end = sub.expiryDate ?? sub.renewsOn;
  if (!end) return false;
  return new Date().getTime() > new Date(end).getTime();
}


export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const planLabel = (months: number) =>
  months === 1 ? "1 Month Membership" : `${months} Month Membership`;


export type PlanExercise = { name: string; sets: string; notes: string };
export type PlanMeal = { time: string; meal: string; macros: string };

export type FoodPreference = "veg" | "non_veg" | "eggitarian" | "vegan";
export type BudgetTier = "low" | "medium" | "high";
export type DietGoal = "weight_loss" | "muscle_gain" | "maintenance";

/** Detailed member inputs used to tailor the generated diet & workout plan. */
export type DietPrefs = {
  foodPreference: FoodPreference;
  favouriteFoods: string;
  budget: BudgetTier;
  restrictions: string;
  goal: DietGoal;
  mealsPerDay: number;
  /** daily calorie target the generated plan must hit */
  calorieTarget: number;
};

export const DEFAULT_CALORIE_TARGET = 2000;

export const DEFAULT_DIET_PREFS: DietPrefs = {
  foodPreference: "veg",
  favouriteFoods: "",
  budget: "medium",
  restrictions: "",
  goal: "muscle_gain",
  mealsPerDay: 4,
  calorieTarget: DEFAULT_CALORIE_TARGET,
};


export const foodPreferenceLabel: Record<FoodPreference, string> = {
  veg: "Veg",
  non_veg: "Non-Veg",
  eggitarian: "Eggitarian",
  vegan: "Vegan",
};

export const budgetLabel: Record<BudgetTier, string> = {
  low: "Low budget — affordable local foods",
  medium: "Medium budget — standard daily diet",
  high: "High budget — exotic foods & supplements",
};

export const dietGoalLabel: Record<DietGoal, string> = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
};

export type PlanRequest = {
  id: string;
  memberId: string;
  gymId: string;
  goal: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  workout: PlanExercise[];
  diet: PlanMeal[];
  /** detailed diet preferences captured with the request */
  prefs?: DietPrefs;
};

/** In-app notification shown in the header bell centre. */
export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  /** in-app destination opened when the card is clicked */
  href?: string;
  /** id of the related plan request / health issue */
  refId?: string;
};

/** Physical issue or soreness reported by a member to their trainer. */
export type HealthIssue = {
  id: string;
  memberId: string;
  gymId: string;
  issue: string;
  at: string;
  resolved: boolean;
};

export type ChecklistItem = { id: string; label: string; detail: string; done: boolean };

type State = {
  users: User[];
  gyms: Gym[];
  requests: PlanRequest[];
  currentUserId: string | null;
  workoutChecklist: ChecklistItem[];
  dietChecklist: ChecklistItem[];
  leads: Lead[];
  checkins: CheckIn[];
  notifications: AppNotification[];
  /** physical issues reported by members */
  healthIssues: HealthIssue[];
  /** affiliate store catalogue — global + per-gym products */
  products: Product[];
  /** read-only guest preview mode */
  guest: boolean;

};

const iso = (d: Date) => d.toISOString();
const today = new Date();
const uid = () => Math.random().toString(36).slice(2, 10);

const seedWorkout: PlanExercise[] = [
  { name: "Barbell Bench Press", sets: "4 × 8", notes: "90s rest, RPE 8" },
  { name: "Incline Dumbbell Press", sets: "3 × 10", notes: "Controlled eccentric" },
  { name: "Cable Fly", sets: "3 × 15", notes: "Squeeze at midline" },
  { name: "Triceps Rope Pushdown", sets: "4 × 12", notes: "Superset with dips" },
  { name: "Plank Hold", sets: "3 × 60s", notes: "Brace core, neutral spine" },
];

const seedDiet: PlanMeal[] = [
  { time: "07:30", meal: "Oats, whey scoop, banana", macros: "480 kcal · 38P/62C/8F" },
  { time: "11:00", meal: "Greek yoghurt + almonds", macros: "260 kcal · 20P/14C/12F" },
  { time: "14:00", meal: "Grilled chicken, brown rice, salad", macros: "620 kcal · 52P/68C/12F" },
  { time: "18:00", meal: "Paneer wrap + black coffee", macros: "380 kcal · 24P/36C/14F" },
  { time: "21:00", meal: "Salmon, quinoa, broccoli", macros: "540 kcal · 44P/38C/22F" },
];

/** Starter catalogue: platform-wide affiliate picks + one local gym product. */
const SEED_PRODUCTS = (gymId: string): Product[] => [
  {
    id: "p_whey", scope: "global", name: "Whey Protein Isolate (1 kg)", category: "Supplements", price: 2899,
    imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=70",
    link: "https://www.amazon.in/s?k=whey+protein+isolate", note: "24g protein per scoop · verified brand",
    createdAt: iso(today),
  },
  {
    id: "p_creatine", scope: "global", name: "Creatine Monohydrate (250 g)", category: "Supplements", price: 999,
    imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c1b5d0b2a?w=600&q=70",
    link: "https://www.amazon.in/s?k=creatine+monohydrate", note: "3–5g daily · strength & recovery",
    createdAt: iso(today),
  },
  {
    id: "p_belt", scope: "global", name: "Lifting Belt & Wrist Wraps", category: "Accessories", price: 1499,
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=70",
    link: "https://www.amazon.in/s?k=gym+lifting+belt", note: "Support for heavy squats and deadlifts",
    createdAt: iso(today),
  },
  {
    id: "p_local_shaker", scope: "gym", gymId, name: "Gym Branded Shaker Bottle", category: "Gym merch", price: 449,
    imageUrl: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=600&q=70",
    link: "https://wa.me/919820044111?text=I%20want%20the%20gym%20shaker%20bottle",
    note: "Collect at the front desk", createdAt: iso(today),
  },
];



function seed(): State {
  const gymId = "gym_pulse";
  const users: User[] = [
    { id: "u_super", name: "Platform Admin", email: SUPER_ADMIN_EMAIL, password: hashPassword(SUPER_ADMIN_PASSWORD), role: "super_admin", ownerCreated: false, mustResetPassword: false, joinedAt: iso(today) },
    { id: "u_owner", name: "Marcus Hale", email: "owner@fitpulse.ai", password: hashPassword("Owner@123"), role: "gym_owner", gymId, ownerCreated: false, mustResetPassword: false, joinedAt: iso(today) },
    { id: "u_trainer", name: "Dana Kim", email: "trainer@fitpulse.ai", password: hashPassword("Trainer@123"), role: "trainer", gymId, ownerCreated: false, mustResetPassword: false, joinedAt: iso(today) },
    {
      id: "u_member", name: "Leo Fernandez", email: "member@fitpulse.ai", phone: "+91 98200 10142", password: hashPassword("Member@2024"), role: "member", gymId,
      ownerCreated: false, mustResetPassword: false, trainerId: "u_trainer", joinedAt: iso(today), streak: 18, attendanceToday: true,
      subscription: {
        plan: planLabel(3), status: "active", amount: DEFAULT_PRICING.m3, months: 3,
        startDate: iso(addMonths(today, -1)), expiryDate: iso(addMonths(today, 2)), renewsOn: iso(addMonths(today, 2)),
      },
    },
    {
      id: "u_deskmember", name: "Priya Nair", email: "desk@fitpulse.ai", phone: "+91 98200 10177", password: hashPassword(DEFAULT_PASSWORD), role: "member", gymId,
      ownerCreated: true, mustResetPassword: true, trainerId: "u_trainer", joinedAt: iso(today), streak: 3, attendanceToday: false,
      subscription: {
        plan: planLabel(1), status: "active", amount: DEFAULT_PRICING.m1, months: 1,
        startDate: iso(today), expiryDate: iso(addMonths(today, 1)), renewsOn: iso(addMonths(today, 1)),
      },
    },
    {
      id: "u_member3", name: "Tomas Weber", email: "tomas@fitpulse.ai", phone: "+91 98200 10190", password: hashPassword("Tomas@123"), role: "member", gymId,
      ownerCreated: false, mustResetPassword: false, trainerId: "u_trainer", joinedAt: iso(today), streak: 7, attendanceToday: false,
      subscription: {
        plan: planLabel(2), status: "expired", amount: DEFAULT_PRICING.m2, months: 2,
        startDate: iso(addMonths(today, -3)), expiryDate: iso(addMonths(today, -1)), renewsOn: iso(addMonths(today, -1)),
      },
    },
  ];

  return {
    users,
    gyms: [{ id: gymId, name: "Pulse Strength Club", slug: "pulse-strength", code: "PULSE24", ownerId: "u_owner", plan: "Growth", mrr: 4820, active: true, pricing: { ...DEFAULT_PRICING }, ownerPhone: "+91 98200 44111", trainerPhone: "+91 98200 44222", ownerWhatsapp: "+91 98200 44111", trainerWhatsapp: "+91 98200 44222", timings: "Mon–Sat 5:30 AM – 10:30 PM · Sun 7 AM – 1 PM", address: "12 Marine Lines, Mumbai 400020" }],

    requests: [
      { id: "r1", memberId: "u_member", gymId, goal: "Lean bulk — 8 week hypertrophy block", requestedAt: iso(today), status: "pending", workout: seedWorkout, diet: seedDiet },
      { id: "r2", memberId: "u_member3", gymId, goal: "Fat loss — cut 6 kg before October", requestedAt: iso(today), status: "pending", workout: seedWorkout, diet: seedDiet },
    ],
    currentUserId: null,
    workoutChecklist: [
      { id: "w1", label: "Barbell Bench Press", detail: "4 × 8 · 90s rest", done: true },
      { id: "w2", label: "Incline Dumbbell Press", detail: "3 × 10", done: true },
      { id: "w3", label: "Cable Fly", detail: "3 × 15", done: false },
      { id: "w4", label: "Triceps Rope Pushdown", detail: "4 × 12", done: false },
      { id: "w5", label: "Plank Hold", detail: "3 × 60s", done: false },
    ],
    dietChecklist: seedDiet.map((m, i) => ({ id: `d${i}`, label: `${m.time} · ${m.meal}`, detail: m.macros, done: i < 2 })),
    leads: [
      { id: "l1", gymId, name: "Ritika Sharma", phone: "+91 98111 20455", note: "Walked in, asked about morning batch", status: "new", createdAt: iso(today) },
      { id: "l2", gymId, name: "Arjun Mehta", phone: "+91 99870 33210", note: "Instagram enquiry — personal training", status: "contacted", createdAt: iso(today) },
    ],
    checkins: [
      { id: "c1", memberId: "u_member", gymId, at: iso(today) },
    ],
    notifications: [
      { id: "n1", userId: "u_member", title: "Welcome to Kool Fit AI", body: "Your membership is active. Check today's workout in the Today tab.", at: iso(today), read: false },
    ],
    healthIssues: [],
    products: SEED_PRODUCTS(gymId),
    guest: false,

  };
}

/** Append in-app notifications for one or more users. */
function pushNote(
  s: State,
  userIds: string[],
  title: string,
  body: string,
  meta?: { href?: string; refId?: string },
): State {
  const at = iso(new Date());
  return {
    ...s,
    notifications: [
      ...userIds.map((userId) => ({
        id: `n_${uid()}`,
        userId,
        title,
        body,
        at,
        read: false,
        ...(meta?.href ? { href: meta.href } : {}),
        ...(meta?.refId ? { refId: meta.refId } : {}),
      })),
      ...(s.notifications ?? []),
    ],
  };
}

type Ctx = {
  state: State;
  /** true once the local cache + cloud snapshot have been loaded */
  hydrated: boolean;
  currentUser: User | null;
  currentGym: Gym | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  signOut: () => void;
  registerGym: (v: { gymName: string; slug: string; ownerName: string; email: string; password: string; phone?: string; timings?: string; address?: string }) => Promise<{ ok: boolean; error?: string }>;
  joinAsMember: (v: {
    code: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    paymentMethod: PaymentMethod;
    months: 1 | 2 | 3;
  }) => Promise<{ ok: boolean; error?: string; userId?: string }>;
  confirmOnlinePayment: (memberId: string, months: 1 | 2 | 3) => { ok: boolean; error?: string };
  approveMemberPayment: (memberId: string) => { ok: boolean; error?: string };
  createMember: (v: { name: string; email: string; phone: string }) => { ok: boolean; error?: string };
  createTrainer: (v: { name: string; email: string; password: string }) => { ok: boolean; error?: string };
  resetPassword: (password: string) => void;
  toggleAttendance: (memberId: string) => void;
  decideRequest: (id: string, status: "approved" | "rejected") => void;
  requestPlan: (goal: string, prefs?: DietPrefs) => void;
  /** trainer / owner manual edits to a pending plan request */
  updateRequestPlan: (id: string, plan: { workout: PlanExercise[]; diet: PlanMeal[] }) => void;
  markNotificationsRead: () => void;
  sendAnnouncement: (title: string, body: string) => void;
  toggleChecklist: (kind: "workout" | "diet", id: string) => void;
  updatePricing: (pricing: Pricing) => void;
  purchaseMembership: (months: 1 | 2 | 3) => { ok: boolean; error?: string };
  demoSignIn: (role: Role) => { ok: boolean; error?: string; user?: User };
  guestSignIn: () => { ok: boolean; error?: string };
  requestRenewal: () => void;
  approveRenewal: (memberId: string) => void;
  setMemberActive: (memberId: string, active: boolean) => void;
  assignPlan: (memberId: string, plan: { goal: string; workout: PlanExercise[]; diet: PlanMeal[] }) => void;
  addLead: (v: { name: string; phone: string; note: string }) => void;
  setLeadStatus: (id: string, status: LeadStatus) => void;
  checkInMember: (memberId: string) => void;
  /** owner-configured contact numbers bound to member quick actions */
  updateGymContacts: (v: GymContacts) => void;
  /** super admin: toggle a gym's platform subscription */
  setGymActive: (gymId: string, active: boolean) => void;
  /** super admin: broadcast to every account on the platform */
  broadcastPlatform: (title: string, body: string) => void;
  setCalorieTarget: (kcal: number) => void;
  logFood: (v: { label: string; kcal: number; protein: number; carbs: number; fat: number }) => void;
  removeFoodLog: (id: string) => void;
  /** affiliate store: super admin adds global products, owners add gym-local ones */
  addProduct: (v: { name: string; category: string; price: number; imageUrl: string; link: string; note: string }) => { ok: boolean; error?: string };
  removeProduct: (id: string) => void;
  /** products visible to a member: global catalogue + their own gym's items */
  visibleProducts: Product[];
  /** member reports a discomfort — alerts the gym owner & trainer */
  reportHealthIssue: (issue: string) => { ok: boolean; error?: string };
  markNotificationRead: (id: string) => void;
  resolveHealthIssue: (id: string) => void;

};




const StoreContext = createContext<Ctx | null>(null);
const KEY = "koolfit-state-v2";
const LEGACY_KEY = "fitpulse-state-v1";

/** Fill in fields added after a user's data was first persisted. */
function migrate(s: State): State {
  // The platform super admin always exists with the current hardcoded credentials.
  const withSuper: User[] = s.users.some((u) => u.role === "super_admin")
    ? s.users.map((u) =>
        u.role === "super_admin"
          ? { ...u, email: SUPER_ADMIN_EMAIL, password: hashPassword(SUPER_ADMIN_PASSWORD), mustResetPassword: false }
          : u,
      )
    : [
        {
          id: "u_super", name: "Platform Admin", email: SUPER_ADMIN_EMAIL, password: hashPassword(SUPER_ADMIN_PASSWORD),
          role: "super_admin" as const, ownerCreated: false, mustResetPassword: false, joinedAt: iso(new Date()),
        },
        ...s.users,
      ];

  return {
    ...s,
    leads: s.leads ?? [],
    checkins: s.checkins ?? [],
    notifications: s.notifications ?? [],
    healthIssues: s.healthIssues ?? [],
    products: s.products?.length ? s.products : SEED_PRODUCTS(s.gyms[0]?.id ?? "gym_pulse"),

    guest: false,
    gyms: s.gyms.map((g) => ({
      ...g,
      pricing: g.pricing ?? { ...DEFAULT_PRICING },
      code: normalizeGymCode(g.code),
      active: g.active ?? true,
    })),
    users: withSuper.map((u) => {

      if (u.role !== "member") return u;
      const base: User = {
        ...u,
        status: u.status ?? "active",
        paymentStatus: u.paymentStatus ?? (u.subscription ? "paid" : "unpaid"),
      };
      return base.subscription
        ? {
            ...base,
            subscription: {
              ...base.subscription,
              startDate: base.subscription.startDate ?? base.joinedAt,
              expiryDate: base.subscription.expiryDate ?? base.subscription.renewsOn,
            },
          }
        : base;
    }),
  };

}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [hydrated, setHydrated] = useState(false);

  /** Merge an authenticated cloud snapshot into local state. */
  const applyCloud = useCallback((cloud: NonNullable<Awaited<ReturnType<typeof loadCloudSnapshot>>>) => {
    setState((s) =>
      migrate({
        ...s,
        users: cloud.users as unknown as User[],
        gyms: cloud.gyms as unknown as Gym[],
        requests: cloud.requests as unknown as PlanRequest[],
        leads: cloud.leads as unknown as Lead[],
        checkins: cloud.checkins as unknown as CheckIn[],
        notifications: cloud.notifications as unknown as AppNotification[],
        healthIssues: cloud.healthIssues as unknown as HealthIssue[],
        products: cloud.products as unknown as Product[],
        workoutChecklist: cloud.workoutChecklist.length
          ? (cloud.workoutChecklist as unknown as ChecklistItem[])
          : s.workoutChecklist,
        dietChecklist: cloud.dietChecklist.length
          ? (cloud.dietChecklist as unknown as ChecklistItem[])
          : s.dietChecklist,
      }),
    );
  }, []);

  // 1) instant local cache, 2) authoritative cloud data for a signed-in session
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (raw) setState(migrate(JSON.parse(raw) as State));
    } catch {
      /* ignore */
    }

    void (async () => {
      const cloud = await loadCloudSnapshot();
      if (cancelled) return;
      if (cloud) applyCloud(cloud);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyCloud]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }

    const t = setTimeout(() => {
      void saveCloudSnapshot({
        users: state.users as unknown as Record<string, unknown>[],
        gyms: state.gyms as unknown as Record<string, unknown>[],
        requests: state.requests as unknown as Record<string, unknown>[],
        leads: state.leads as unknown as Record<string, unknown>[],
        checkins: state.checkins as unknown as Record<string, unknown>[],
        notifications: state.notifications as unknown as Record<string, unknown>[],
        healthIssues: state.healthIssues as unknown as Record<string, unknown>[],
        products: state.products as unknown as Record<string, unknown>[],
        workoutChecklist: state.workoutChecklist as unknown as Record<string, unknown>[],
        dietChecklist: state.dietChecklist as unknown as Record<string, unknown>[],
      });
    }, 700);
    return () => clearTimeout(t);
  }, [state, hydrated]);


  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const currentGym = state.gyms.find((g) => g.id === currentUser?.gymId) ?? null;

  /** Credentials are always verified on the server; the browser never sees other accounts' hashes. */
  const signIn = useCallback<Ctx["signIn"]>(
    async (email, password) => {
      // Always drop any stale/active session before authenticating again.
      clearSession();
      setState((s) => ({ ...s, currentUserId: null, guest: false }));

      const hash = hashPassword(password);
      const auth = await cloudSignIn({ email: email.trim(), passwordHash: hash });
      if (!auth.ok || !auth.userId) return { ok: false, error: auth.error ?? "Invalid email or password" };

      const cloud = await loadCloudSnapshot();
      if (cloud) applyCloud(cloud);

      const mustReset = hash === hashPassword(DEFAULT_PASSWORD) || auth.mustReset === true;
      let user: User | undefined;
      setState((s) => {
        const found = s.users.find((u) => u.id === auth.userId);
        if (found) user = { ...found, mustResetPassword: mustReset };
        return {
          ...s,
          currentUserId: auth.userId ?? null,
          users: s.users.map((u) => (u.id === auth.userId ? { ...u, mustResetPassword: mustReset } : u)),
        };
      });
      // state updates are async — resolve the user from the freshly loaded snapshot too
      const fromCloud = (cloud?.users as unknown as User[] | undefined)?.find((u) => u.id === auth.userId);
      const resolved = user ?? (fromCloud ? { ...fromCloud, mustResetPassword: mustReset } : undefined);
      if (!resolved) return { ok: false, error: "Account data unavailable, please try again" };
      return { ok: true, user: resolved };
    },
    [applyCloud],
  );

  const signOut = useCallback(() => {
    clearSession();
    setState((s) => ({ ...s, currentUserId: null }));
  }, []);

  const registerGym = useCallback<Ctx["registerGym"]>(async (v) => {
    const gymId = `gym_${uid()}`;
    const ownerId = `u_${uid()}`;
    const hash = hashPassword(v.password);
    const auth = await cloudSignIn({ email: v.email.trim(), passwordHash: hash, allowCreate: true, userId: ownerId });
    if (!auth.ok) return { ok: false, error: auth.error ?? "An account with that email already exists" };
    const id = auth.userId ?? ownerId;

    let res: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      if (s.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) {
        res = { ok: false, error: "An account with that email already exists" };
        return s;
      }
      const gym: Gym = { id: gymId, name: v.gymName, slug: v.slug, code: normalizeGymCode(v.slug.slice(0, 5) + "24"), ownerId: id, plan: "Starter", mrr: 0, pricing: { ...DEFAULT_PRICING }, ownerPhone: v.phone ?? "", timings: v.timings ?? "6:00 AM – 10:00 PM", address: v.address ?? "" };
      const owner: User = { id, name: v.ownerName, email: v.email, phone: v.phone, password: hash, role: "gym_owner", gymId, ownerCreated: false, mustResetPassword: false, joinedAt: iso(new Date()) };
      return { ...s, gyms: [...s.gyms, gym], users: [...s.users, owner], currentUserId: id };
    });
    return res;
  }, []);

  const joinAsMember = useCallback<Ctx["joinAsMember"]>(async (v) => {
    const newId = `u_${uid()}`;
    const hash = hashPassword(v.password);
    const auth = await cloudSignIn({ email: v.email.trim(), passwordHash: hash, allowCreate: true, userId: newId });
    if (!auth.ok) return { ok: false, error: auth.error ?? "An account with that email already exists" };
    const id = auth.userId ?? newId;

    let res: { ok: boolean; error?: string; userId?: string } = { ok: true, userId: id };
    setState((s) => {
      const code = normalizeGymCode(v.code);
      const gym = s.gyms.find((g) => normalizeGymCode(g.code) === code);
      if (!gym) {
        res = { ok: false, error: "No gym found for that code" };
        return s;
      }
      if (s.users.some((u) => u.id !== id && u.email.trim().toLowerCase() === v.email.trim().toLowerCase())) {
        res = { ok: false, error: "An account with that email already exists" };
        return s;
      }
      const trainer = s.users.find((u) => u.role === "trainer" && u.gymId === gym.id);
      // New sign-ups are never auto-activated — payment decides the status.
      const member: User = {
        id, name: v.name.trim(), email: v.email.trim(), phone: v.phone, password: hash, role: "member", gymId: gym.id,
        ownerCreated: false, mustResetPassword: false, trainerId: trainer?.id, joinedAt: iso(new Date()), streak: 0, attendanceToday: false,
        status: "pending_approval", paymentStatus: "unpaid", paymentMethod: v.paymentMethod, requestedMonths: v.months,
      };
      return { ...s, users: [...s.users.filter((u) => u.id !== id), member], currentUserId: id };
    });
    return res;
  }, []);



  /** Grant an active membership after a verified payment (online or at the desk). */
  const activate = useCallback((memberId: string, months: 1 | 2 | 3 | undefined) => {
    let res: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      const member = s.users.find((u) => u.id === memberId);
      if (!member || member.role !== "member") {
        res = { ok: false, error: "Member not found" };
        return s;
      }
      const plan = months ?? member.requestedMonths ?? 1;
      const gym = s.gyms.find((g) => g.id === member.gymId);
      const pricing = gym?.pricing ?? DEFAULT_PRICING;
      const amount = plan === 1 ? pricing.m1 : plan === 2 ? pricing.m2 : pricing.m3;
      const start = new Date();
      const expiry = addMonths(start, plan);
      const subscription: Subscription = {
        plan: planLabel(plan), status: "active", amount, months: plan,
        startDate: iso(start), expiryDate: iso(expiry), renewsOn: iso(expiry),
      };
      return pushNote(
        {
          ...s,
          users: s.users.map((u) =>
            u.id === memberId ? { ...u, status: "active" as const, paymentStatus: "paid" as const, subscription } : u,
          ),
        },
        [memberId],
        "Renewal Approved",
        `${planLabel(plan)} is active until ${expiry.toLocaleDateString("en-IN")}.`,
      );
    });
    return res;
  }, []);

  const confirmOnlinePayment = useCallback<Ctx["confirmOnlinePayment"]>(
    (memberId, months) => activate(memberId, months),
    [activate],
  );

  const approveMemberPayment = useCallback<Ctx["approveMemberPayment"]>(
    (memberId) => activate(memberId, undefined),
    [activate],
  );


  const createMember = useCallback<Ctx["createMember"]>(
    (v) => {
      let res: { ok: boolean; error?: string } = { ok: true };
      setState((s) => {
        const actor = s.users.find((u) => u.id === s.currentUserId);
        if (!actor?.gymId) return s;
        if (s.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) {
          res = { ok: false, error: "An account with that email already exists" };
          return s;
        }
        const trainer = s.users.find((u) => u.role === "trainer" && u.gymId === actor.gymId);
        const member: User = {
          id: `u_${uid()}`, name: v.name, email: v.email, phone: v.phone, password: hashPassword(DEFAULT_PASSWORD), role: "member",
          gymId: actor.gymId, ownerCreated: true, mustResetPassword: true, trainerId: trainer?.id, joinedAt: iso(new Date()),
          streak: 0, attendanceToday: false, status: "active", paymentStatus: "paid",
        };

        return { ...s, users: [...s.users, member] };
      });
      return res;
    },
    [],
  );

  const createTrainer = useCallback<Ctx["createTrainer"]>((v) => {
    let res: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor?.gymId) return s;
      if (s.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) {
        res = { ok: false, error: "An account with that email already exists" };
        return s;
      }
      const trainer: User = { id: `u_${uid()}`, name: v.name, email: v.email, password: hashPassword(v.password), role: "trainer", gymId: actor.gymId, ownerCreated: false, mustResetPassword: false, joinedAt: iso(new Date()) };
      return { ...s, users: [...s.users, trainer] };
    });
    return res;
  }, []);

  const resetPassword = useCallback((password: string) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, password: hashPassword(password), mustResetPassword: false } : u)),
    }));
  }, []);

  const toggleAttendance = useCallback((memberId: string) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === memberId
          ? { ...u, attendanceToday: !u.attendanceToday, streak: (u.streak ?? 0) + (u.attendanceToday ? -1 : 1) }
          : u,
      ),
    }));
  }, []);

  const decideRequest = useCallback((id: string, status: "approved" | "rejected") => {
    setState((s) => {
      const req = s.requests.find((r) => r.id === id);
      let next: State = { ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) };
      if (!req) return next;
      if (status === "approved") {
        next = {
          ...next,
          users: next.users.map((u) =>
            u.id === req.memberId
              ? { ...u, assignedPlan: { goal: req.goal, assignedAt: iso(new Date()), workout: req.workout, diet: req.diet } }
              : u,
          ),
        };
      }
      return pushNote(
        next,
        [req.memberId],
        status === "approved" ? "Plan Approved" : "Plan Rejected",
        status === "approved"
          ? `Your plan “${req.goal}” is ready in My AI Plan.`
          : `Your request “${req.goal}” was rejected. Talk to your trainer.`,
      );
    });
  }, []);

  const requestPlan = useCallback((goal: string, prefs?: DietPrefs) => {
    setState((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      if (!me?.gymId) return s;
      const generated = prefs ? buildPlan(prefs) : { workout: seedWorkout, diet: seedDiet };
      const req: PlanRequest = {
        id: `r_${uid()}`, memberId: me.id, gymId: me.gymId, goal, requestedAt: iso(new Date()), status: "pending",
        workout: generated.workout, diet: generated.diet, ...(prefs ? { prefs } : {}),
      };
      const staff = s.users
        .filter((u) => (u.role === "trainer" || u.role === "gym_owner") && u.gymId === me.gymId)
        .map((u) => u.id);
      const users = prefs
        ? s.users.map((u) => (u.id === me.id ? { ...u, calorieTarget: prefs.calorieTarget } : u))
        : s.users;
      return pushNote(
        { ...s, users, requests: [req, ...s.requests] },
        staff,
        "New Plan Request",
        `${me.name}: ${goal}`,
        { href: "/trainer-portal", refId: req.id },
      );

    });
  }, []);

  const updateRequestPlan = useCallback<Ctx["updateRequestPlan"]>((id, plan) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => (r.id === id ? { ...r, workout: plan.workout, diet: plan.diet } : r)),
    }));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.userId === s.currentUserId ? { ...n, read: true } : n)),
    }));
  }, []);

  const sendAnnouncement = useCallback<Ctx["sendAnnouncement"]>((title, body) => {
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor?.gymId) return s;
      const memberIds = s.users.filter((u) => u.role === "member" && u.gymId === actor.gymId).map((u) => u.id);
      return pushNote(s, memberIds, title || "New Announcement", body);
    });
  }, []);


  const toggleChecklist = useCallback((kind: "workout" | "diet", id: string) => {
    setState((s) => {
      const key = kind === "workout" ? "workoutChecklist" : "dietChecklist";
      return { ...s, [key]: s[key].map((i) => (i.id === id ? { ...i, done: !i.done } : i)) } as State;
    });
  }, []);


  const updatePricing = useCallback<Ctx["updatePricing"]>((pricing) => {
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor?.gymId) return s;
      return { ...s, gyms: s.gyms.map((g) => (g.id === actor.gymId ? { ...g, pricing } : g)) };
    });
  }, []);

  const purchaseMembership = useCallback<Ctx["purchaseMembership"]>(
    (months) => {
      if (!currentUser || currentUser.role !== "member") {
        return { ok: false, error: "Only members can buy a membership" };
      }
      return activate(currentUser.id, months);
    },
    [activate, currentUser],
  );


  const demoSignIn = useCallback<Ctx["demoSignIn"]>((role) => {
    let res: { ok: boolean; error?: string; user?: User } = { ok: false, error: "No demo account available" };
    setState((s) => {
      const user = s.users.find((u) => u.role === role);
      if (!user) return s;
      res = { ok: true, user };
      return { ...s, currentUserId: user.id };
    });
    return res;
  }, []);

  /** Read-only preview: signs into the demo member account with a guest banner. */
  const guestSignIn = useCallback<Ctx["guestSignIn"]>(() => {
    const user = state.users.find((u) => u.role === "member" && u.status !== "pending_approval");
    if (!user) return { ok: false, error: "Demo data unavailable" };
    setState((s) => ({ ...s, currentUserId: user.id, guest: true }));
    return { ok: true };
  }, [state.users]);


  const requestRenewal = useCallback(() => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, renewalPending: true } : u)),
    }));
  }, []);

  const approveRenewal = useCallback<Ctx["approveRenewal"]>(
    (memberId) => {
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === memberId ? { ...u, renewalPending: false } : u)),
      }));
      activate(memberId, undefined);
    },
    [activate],
  );

  const setMemberActive = useCallback<Ctx["setMemberActive"]>((memberId, active) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === memberId
          ? {
              ...u,
              status: active ? ("active" as const) : ("pending_approval" as const),
              paymentStatus: active ? ("paid" as const) : ("unpaid" as const),
            }
          : u,
      ),
    }));
  }, []);

  const assignPlan = useCallback<Ctx["assignPlan"]>((memberId, plan) => {
    setState((s) =>
      pushNote(
        {
          ...s,
          users: s.users.map((u) => {
            if (u.id !== memberId) return u;
            const prev = u.assignedPlan;
            // Empty arrays mean "leave this part of the plan untouched" so
            // workout and diet plans can be generated/assigned independently.
            const workout = plan.workout.length ? plan.workout : (prev?.workout ?? []);
            const diet = plan.diet.length ? plan.diet : (prev?.diet ?? []);
            return {
              ...u,
              assignedPlan: { goal: plan.goal, workout, diet, assignedAt: iso(new Date()) },
            };
          }),
        },
        [memberId],
        "New Plan Assigned",
        `${plan.goal} — open My AI Plan to see it.`,
      ),
    );
  }, []);


  const addLead = useCallback<Ctx["addLead"]>((v) => {
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor?.gymId) return s;
      const lead: Lead = {
        id: `l_${uid()}`, gymId: actor.gymId, name: v.name, phone: v.phone, note: v.note,
        status: "new", createdAt: iso(new Date()),
      };
      return { ...s, leads: [lead, ...s.leads] };
    });
  }, []);

  const setLeadStatus = useCallback<Ctx["setLeadStatus"]>((id, status) => {
    setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) }));
  }, []);

  const checkInMember = useCallback<Ctx["checkInMember"]>((memberId) => {
    setState((s) => {
      const member = s.users.find((u) => u.id === memberId);
      if (!member?.gymId) return s;
      const entry: CheckIn = { id: `c_${uid()}`, memberId, gymId: member.gymId, at: iso(new Date()) };
      return pushNote(
        {
          ...s,
          checkins: [entry, ...s.checkins],
          users: s.users.map((u) =>
            u.id === memberId && !u.attendanceToday
              ? { ...u, attendanceToday: true, streak: (u.streak ?? 0) + 1 }
              : u,
          ),
        },
        [memberId],
        "Check-in Confirmed",
        `Checked in at ${new Date().toLocaleTimeString("en-IN")}. Keep the streak going.`,
      );
    });
  }, []);

  const updateGymContacts = useCallback<Ctx["updateGymContacts"]>((v) => {
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor?.gymId) return s;
      return {
        ...s,
        gyms: s.gyms.map((g) =>
          g.id === actor.gymId
            ? {
                ...g,
                ownerPhone: v.ownerPhone,
                trainerPhone: v.trainerPhone,
                ownerWhatsapp: v.ownerWhatsapp,
                trainerWhatsapp: v.trainerWhatsapp,
                timings: v.timings,
                address: v.address,
              }
            : g,
        ),
      };
    });
  }, []);

  const setGymActive = useCallback<Ctx["setGymActive"]>((gymId, active) => {
    setState((s) => ({ ...s, gyms: s.gyms.map((g) => (g.id === gymId ? { ...g, active } : g)) }));
  }, []);

  const broadcastPlatform = useCallback<Ctx["broadcastPlatform"]>((title, body) => {
    setState((s) =>
      pushNote(
        s,
        s.users.filter((u) => u.role !== "super_admin").map((u) => u.id),
        title || "Platform Announcement",
        body,
      ),
    );
  }, []);

  const setCalorieTarget = useCallback<Ctx["setCalorieTarget"]>((kcal) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, calorieTarget: Math.max(800, Math.round(kcal)) } : u)),
    }));
  }, []);

  const logFood = useCallback<Ctx["logFood"]>((v) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId
          ? { ...u, foodLog: [{ id: `f_${uid()}`, at: iso(new Date()), ...v }, ...(u.foodLog ?? [])] }
          : u,
      ),
    }));
  }, []);

  const removeFoodLog = useCallback<Ctx["removeFoodLog"]>((id) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId ? { ...u, foodLog: (u.foodLog ?? []).filter((f) => f.id !== id) } : u,
      ),
    }));
  }, []);

  const addProduct = useCallback<Ctx["addProduct"]>((v) => {
    let res: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      const actor = s.users.find((u) => u.id === s.currentUserId);
      if (!actor || (actor.role !== "super_admin" && actor.role !== "gym_owner")) {
        res = { ok: false, error: "Only the platform admin or a gym owner can add products" };
        return s;
      }
      if (!v.name.trim() || !v.link.trim()) {
        res = { ok: false, error: "Product name and buy link are required" };
        return s;
      }
      const global = actor.role === "super_admin";
      const product: Product = {
        id: `p_${uid()}`,
        scope: global ? "global" : "gym",
        ...(global ? {} : { gymId: actor.gymId }),
        name: v.name.trim(),
        category: v.category.trim() || (global ? "Supplements" : "Gym store"),
        price: Math.max(0, Math.round(v.price || 0)),
        imageUrl: v.imageUrl.trim(),
        link: v.link.trim(),
        note: v.note.trim(),
        createdAt: iso(new Date()),
      };
      return { ...s, products: [product, ...(s.products ?? [])] };
    });
    return res;
  }, []);

  const removeProduct = useCallback<Ctx["removeProduct"]>((id) => {
    setState((s) => ({ ...s, products: (s.products ?? []).filter((p) => p.id !== id) }));
  }, []);

  /** Global catalogue + the current user's gym-local products. */
  const visibleProducts = useMemo<Product[]>(() => {
    const all = state.products ?? [];
    if (currentUser?.role === "super_admin") return all;
    const gymId = currentUser?.gymId;
    return all.filter((p) => p.scope === "global" || (gymId ? p.gymId === gymId : false));
  }, [state.products, currentUser]);

  const reportHealthIssue = useCallback<Ctx["reportHealthIssue"]>((issue) => {
    let res: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      if (!me?.gymId || !issue.trim()) {
        res = { ok: false, error: "Describe the issue first" };
        return s;
      }
      const staff = s.users
        .filter((u) => (u.role === "trainer" || u.role === "gym_owner") && u.gymId === me.gymId)
        .map((u) => u.id);
      if (!staff.length) {
        res = { ok: false, error: "No trainer or owner is linked to your gym yet" };
        return s;
      }
      const record: HealthIssue = {
        id: `h_${uid()}`,
        memberId: me.id,
        gymId: me.gymId,
        issue: issue.trim(),
        at: iso(new Date()),
        resolved: false,
      };
      return pushNote(
        { ...s, healthIssues: [record, ...(s.healthIssues ?? [])] },
        staff,
        "Member health issue",
        `${me.name}: ${issue.trim()}`,
        { href: "/trainer-portal", refId: record.id },
      );
    });
    return res;
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const resolveHealthIssue = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      healthIssues: (s.healthIssues ?? []).map((h) => (h.id === id ? { ...h, resolved: true } : h)),
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, hydrated, currentUser, currentGym, signIn, signOut, registerGym, joinAsMember, confirmOnlinePayment, approveMemberPayment, createMember, createTrainer, resetPassword, toggleAttendance, decideRequest, requestPlan, updateRequestPlan, markNotificationsRead, sendAnnouncement, toggleChecklist, updatePricing, purchaseMembership, demoSignIn, guestSignIn, requestRenewal, approveRenewal, setMemberActive, assignPlan, addLead, setLeadStatus, checkInMember, updateGymContacts, setGymActive, broadcastPlatform, setCalorieTarget, logFood, removeFoodLog, addProduct, removeProduct, visibleProducts, reportHealthIssue, markNotificationRead, resolveHealthIssue }),
    [state, hydrated, currentUser, currentGym, signIn, signOut, registerGym, joinAsMember, confirmOnlinePayment, approveMemberPayment, createMember, createTrainer, resetPassword, toggleAttendance, decideRequest, requestPlan, updateRequestPlan, markNotificationsRead, sendAnnouncement, toggleChecklist, updatePricing, purchaseMembership, demoSignIn, guestSignIn, requestRenewal, approveRenewal, setMemberActive, assignPlan, addLead, setLeadStatus, checkInMember, updateGymContacts, setGymActive, broadcastPlatform, setCalorieTarget, logFood, removeFoodLog, addProduct, removeProduct, visibleProducts, reportHealthIssue, markNotificationRead, resolveHealthIssue],
  );





  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const roleHome: Record<Role, string> = {
  super_admin: "/super-admin",
  gym_owner: "/gym-owner",
  trainer: "/trainer-portal",
  member: "/member-portal",
};

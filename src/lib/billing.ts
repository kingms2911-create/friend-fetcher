/**
 * Platform billing rules.
 *
 * - Gym owners pay ₹2 per active member every month.
 * - Websites renew once a year for ₹2,000.
 *
 * Everything here is pure: it reads gyms/users and returns the amounts and
 * statuses the dashboards render.
 */
import type { BillingPayment, Gym, User } from "./fitpulse-store";

export const PLATFORM_FEE_PER_MEMBER = 2;
export const ANNUAL_WEBSITE_FEE = 2000;
/** Monthly invoices are due on the 7th of the month they cover. */
export const MONTHLY_DUE_DAY = 7;
/** Platform collection UPI handle used for the owner's UPI deep link. */
export const PLATFORM_UPI_ID = "9674739943@ptyes";
export const PLATFORM_UPI_NAME = "Kool Fit AI";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** "2026-09" style key for a calendar month. */
export function billingPeriod(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function paymentsOf(gym: Gym | null | undefined): BillingPayment[] {
  return gym?.payments ?? [];
}

/** Members of a gym that still count towards the monthly platform fee. */
export function activeMemberCount(users: User[], gymId: string): number {
  return users.filter(
    (u) =>
      u.role === "member" &&
      u.gymId === gymId &&
      u.status !== "pending_approval" &&
      u.status !== "rejected" &&
      !u.rejected,
  ).length;
}

export type MonthlyBill = {
  period: string;
  periodLabel: string;
  activeMembers: number;
  amount: number;
  paid: boolean;
  paidOn?: string;
  dueDate: Date;
  overdue: boolean;
  daysOverdue: number;
};

export function monthlyBill(gym: Gym | null | undefined, users: User[], now: Date = new Date()): MonthlyBill {
  const period = billingPeriod(now);
  const activeMembers = gym ? activeMemberCount(users, gym.id) : 0;
  const amount = activeMembers * PLATFORM_FEE_PER_MEMBER;
  const payment = paymentsOf(gym).find((p) => p.kind === "monthly" && p.period === period);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), MONTHLY_DUE_DAY, 23, 59, 59);
  const paid = Boolean(payment) || amount === 0;
  const msOver = now.getTime() - dueDate.getTime();
  return {
    period,
    periodLabel: periodLabel(period),
    activeMembers,
    amount,
    paid,
    ...(payment?.paidAt ? { paidOn: payment.paidAt } : {}),
    dueDate,
    overdue: !paid && msOver > 0,
    daysOverdue: !paid && msOver > 0 ? Math.floor(msOver / 86_400_000) : 0,
  };
}

export type AnnualRenewal = {
  /** date the website was switched on */
  activatedOn: Date;
  /** next 12-month renewal date */
  dueOn: Date;
  /** the cycle key stored with the payment */
  period: string;
  amount: number;
  paid: boolean;
  /** true once the renewal date is within 30 days or already past */
  dueSoon: boolean;
  overdue: boolean;
};

export function annualRenewal(
  gym: Gym | null | undefined,
  fallbackActivation: string | undefined,
  now: Date = new Date(),
): AnnualRenewal {
  const activatedOn = new Date(gym?.activatedAt ?? fallbackActivation ?? now.toISOString());
  const dueOn = new Date(activatedOn);
  while (dueOn.getTime() <= now.getTime()) dueOn.setFullYear(dueOn.getFullYear() + 1);
  const period = `annual-${dueOn.getFullYear()}`;
  const paid = paymentsOf(gym).some((p) => p.kind === "annual" && p.period === period);
  const daysToDue = (dueOn.getTime() - now.getTime()) / 86_400_000;
  return {
    activatedOn,
    dueOn,
    period,
    amount: ANNUAL_WEBSITE_FEE,
    paid,
    dueSoon: !paid && daysToDue <= 30,
    overdue: false,
  };
}

/** UPI deep link that opens GPay / PhonePe / Paytm with the amount pre-filled. */
export function upiPayUrl(amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: PLATFORM_UPI_ID,
    pn: PLATFORM_UPI_NAME,
    am: String(Math.max(1, Math.round(amount))),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

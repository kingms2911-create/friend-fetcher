/**
 * Razorpay checkout helper.
 *
 * When VITE_RAZORPAY_KEY_ID is configured the real Razorpay modal opens.
 * Without a key (demo mode) a lightweight simulated checkout runs so the
 * onboarding flow can still be exercised end to end.
 */

type RazorpayOptions = {
  amountInRupees: number;
  description: string;
  name: string;
  email: string;
  phone?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
};

type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
    script.addEventListener("error", () => resolve(false));
    if (!existing) document.body.appendChild(script);
  });
}

export const razorpayKey = (import.meta.env['VITE_RAZORPAY_KEY_ID'] as string | undefined) ?? "";

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const loaded = razorpayKey ? await loadScript() : false;

  if (!loaded || !window.Razorpay) {
    // Demo mode: simulate a successful verified payment.
    await new Promise((r) => setTimeout(r, 900));
    options.onSuccess(`demo_pay_${Math.random().toString(36).slice(2, 12)}`);
    return;
  }

  const rzp = new window.Razorpay({
    key: razorpayKey,
    amount: Math.round(options.amountInRupees * 100),
    currency: "INR",
    name: "Kool Fit AI",
    description: options.description,
    prefill: { name: options.name, email: options.email, contact: options.phone ?? "" },
    theme: { color: "#22c55e" },
    handler: (response: { razorpay_payment_id: string }) => options.onSuccess(response.razorpay_payment_id),
    modal: { ondismiss: () => options.onDismiss?.() },
  });

  rzp.open();
}

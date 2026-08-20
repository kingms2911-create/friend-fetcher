/** Shared tel: / WhatsApp deep-link helpers. */
export const telHref = (phone?: string) => `tel:${(phone ?? "").replace(/[^\d+]/g, "")}`;

export const waHref = (phone?: string, text = "Hi! I have a question about my membership.") =>
  `https://wa.me/${(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

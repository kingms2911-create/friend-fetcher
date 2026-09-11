import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLATFORM_UPI_ID, PLATFORM_UPI_NAME, inr, upiPayUrl } from "@/lib/billing";
import { toast } from "sonner";

/**
 * Payment sheet for the platform fee: shows a scannable UPI QR code, the UPI id
 * to copy, and a button that opens an installed UPI app on phones.
 */
export function UpiPayDialog({
  open,
  onOpenChange,
  amount,
  note,
  title,
  onConfirmPaid,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  note: string;
  title: string;
  onConfirmPaid: () => void;
}) {
  const [dataUrl, setDataUrl] = useState("");
  const link = upiPayUrl(amount, note);
  const paymentQuery = link.slice("upi://pay?".length);
  const appLinks = [
    { name: "GPay", href: `tez://upi/pay?${paymentQuery}` },
    { name: "PhonePe", href: `phonepe://pay?${paymentQuery}` },
    { name: "Paytm", href: `paytmmp://pay?${paymentQuery}` },
  ];

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void QRCode.toDataURL(link, {
      width: 460,
      margin: 1,
      color: { dark: "#09090b", light: "#ffffff" },
    }).then((url) => {
      if (alive) setDataUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [link, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pay {inr(amount)} to {PLATFORM_UPI_NAME}. Scan the code with any UPI app, or copy the id below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-border/60 bg-white p-3">
            {dataUrl ? (
              <img src={dataUrl} alt="UPI payment QR code" width={200} height={200} style={{ width: 200, height: 200 }} />
            ) : (
              <div style={{ width: 200, height: 200 }} className="grid place-items-center text-zinc-500">
                <QrCode className="size-8" />
              </div>
            )}
          </div>
          <p className="text-2xl font-semibold">{inr(amount)}</p>
          <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary px-3 py-2">
            <span className="min-w-0 truncate text-sm">{PLATFORM_UPI_ID}</span>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-border/70 bg-secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(PLATFORM_UPI_ID);
                toast.success("UPI ID copied");
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
          </div>

          <div className="grid w-full grid-cols-3 gap-2">
            {appLinks.map((app) => (
              <Button key={app.name} asChild size="sm">
                <a href={app.href} rel="external">
                  <Smartphone className="size-4" /> {app.name}
                </a>
              </Button>
            ))}
          </div>
          <Button variant="outline" className="w-full border-border/70 bg-secondary" onClick={onConfirmPaid}>
            <Check className="size-4" /> I have paid
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Choose an installed payment app. If it does not open inside the preview, scan the QR code from the payment app.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

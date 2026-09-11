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

  const openUpiApp = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const target = isAndroid
      ? `intent://${link.slice("upi://".length)}#Intent;scheme=upi;action=android.intent.action.VIEW;end`
      : link;

    // This must happen synchronously inside the tap event or mobile browsers
    // and embedded webviews can silently block the external-app launch.
    window.location.assign(target);

    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        toast.info("No UPI app opened. Copy the UPI ID or scan the QR code instead.");
      }
    }, 1800);
  };

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

          <Button type="button" className="w-full" onClick={openUpiApp}>
            <Smartphone className="size-4" /> Open UPI app
          </Button>
          <Button variant="outline" className="w-full border-border/70 bg-secondary" onClick={onConfirmPaid}>
            <Check className="size-4" /> I have paid
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            "Open UPI app" only works on a phone with GPay, PhonePe or Paytm installed. On a laptop, scan the QR code.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

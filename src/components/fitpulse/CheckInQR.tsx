import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Renders the gym's unique check-in QR code with a download action. */
export function CheckInQR({ code, size = 200 }: { code: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState("");
  const target =
    typeof window !== "undefined"
      ? `${window.location.origin}/login?gym=${encodeURIComponent(code)}&checkin=1`
      : `https://kool-fit-ai.lovable.app/login?gym=${encodeURIComponent(code)}&checkin=1`;

  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(target, {
      width: size * 2,
      margin: 1,
      color: { dark: "#09090b", light: "#ffffff" },
    }).then((url) => {
      if (alive) setDataUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [target, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-zinc-800 bg-white p-3">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Gym check-in QR code for ${code}`}
            width={size}
            height={size}
            className="block"
            style={{ width: size, height: size }}
          />
        ) : (
          <div style={{ width: size, height: size }} className="grid place-items-center text-zinc-500">
            <QrCode className="size-8" />
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Members scan this at the front desk to check in · gym code{" "}
        <span className="font-semibold text-primary">{code}</span>
      </p>
      <Button
        variant="outline"
        className="border-zinc-700 bg-zinc-900"
        disabled={!dataUrl}
        onClick={() => {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `checkin-qr-${code}.png`;
          a.click();
        }}
      >
        <Download className="size-4" /> Download QR code
      </Button>
    </div>
  );
}

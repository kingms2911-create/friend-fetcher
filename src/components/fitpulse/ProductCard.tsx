import { ExternalLink, Trash2 } from "lucide-react";
import type { Product } from "@/lib/fitpulse-store";
import { Button } from "@/components/ui/button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Storefront tile with global / gym-owner provenance badge. */
export function ProductCard({ product, onRemove }: { product: Product; onRemove?: (id: string) => void }) {
  const global = product.scope === "global";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-secondary">
      <div className="relative aspect-[4/3] w-full bg-zinc-900">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted-foreground">No image</div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            global ? "bg-primary/20 text-primary" : "bg-chart-3/20 text-chart-3"
          }`}
        >
          {global ? "Global" : "Added by Gym Owner"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.category}</p>
        <h3 className="mt-1 text-sm font-semibold">{product.name}</h3>
        {product.note ? <p className="mt-1 text-xs text-muted-foreground">{product.note}</p> : null}
        <p className="mt-3 text-lg font-semibold">{inr(product.price)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buy now <ExternalLink className="size-3.5" />
          </a>
          {onRemove ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border/70 bg-secondary"
              onClick={() => onRemove(product.id)}
            >
              <Trash2 className="size-3.5" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

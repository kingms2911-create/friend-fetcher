import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { GlassCard } from "@/components/fitpulse/AppShell";
import { ProductCard } from "@/components/fitpulse/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/lib/fitpulse-store";

/** Shared add/remove affiliate product panel used by super admin and gym owners. */
export function StoreManager({
  heading,
  description,
  products,
  onAdd,
  onRemove,
}: {
  heading: string;
  description: string;
  products: Product[];
  onAdd: (v: { name: string; category: string; price: number; imageUrl: string; link: string; note: string }) => { ok: boolean; error?: string };
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <PackagePlus className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{heading}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const res = onAdd({ name, category, price: Number(price), imageUrl, link, note });
          if (!res.ok) return setError(res.error ?? "Could not add product");
          setError("");
          setName("");
          setCategory("");
          setPrice("");
          setImageUrl("");
          setLink("");
          setNote("");
        }}
      >
        <Field id="pr-name" label="Product name" value={name} onChange={setName} placeholder="Whey Protein 1 kg" />
        <Field id="pr-cat" label="Category" value={category} onChange={setCategory} placeholder="Supplements" />
        <Field id="pr-price" label="Price (₹)" value={price} onChange={setPrice} placeholder="2899" type="number" />
        <Field id="pr-img" label="Image URL" value={imageUrl} onChange={setImageUrl} placeholder="https://…/whey.jpg" />
        <Field id="pr-link" label="Buy / affiliate link" value={link} onChange={setLink} placeholder="https://amzn.to/…" />
        <Field id="pr-note" label="Short note" value={note} onChange={setNote} placeholder="24g protein per scoop" />
        <div className="sm:col-span-2">
          {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
          <Button type="submit">Add product</Button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} onRemove={onRemove} />)
        )}
      </div>
    </GlassCard>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

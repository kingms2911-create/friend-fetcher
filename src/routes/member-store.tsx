import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { ProductCard } from "@/components/fitpulse/ProductCard";
import { useStore, type Product } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/member-store")({
  head: () => ({
    meta: [
      { title: "Gym Store — Supplements & Gear | Kool Fit AI" },
      {
        name: "description",
        content:
          "Shop whey protein, creatine, gym accessories and your gym's own local products, curated for Kool Fit AI members.",
      },
      { property: "og:title", content: "Gym Store — Supplements & Gear | Kool Fit AI" },
      { property: "og:description", content: "Platform picks plus products added by your own gym owner." },
    ],
  }),
  component: MemberStorePage,
});

function MemberStorePage() {
  const { visibleProducts, currentGym } = useStore();
  const global = visibleProducts.filter((p) => p.scope === "global");
  const local = visibleProducts.filter((p) => p.scope === "gym");

  return (
    <AppShell
      role="member"
      title="Gym store"
      subtitle="Platform picks plus products from your own gym"
      nav={<MemberTabs />}
    >
      <Section
        title={`${currentGym?.name ?? "Your gym"} store`}
        hint="Added by your gym owner — available locally."
        products={local}
        empty="Your gym owner hasn't listed any local products yet."
      />
      <Section
        title="Global picks"
        hint="Curated by Kool Fit AI for every gym on the platform."
        products={global}
        empty="No global products listed yet."
      />
    </AppShell>
  );
}

function Section({
  title,
  hint,
  products,
  empty,
}: {
  title: string;
  hint: string;
  products: Product[];
  empty: string;
}) {
  return (
    <GlassCard className="mt-6 first:mt-0">
      <div className="flex items-center gap-2">
        <ShoppingBag className="size-4 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {products.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

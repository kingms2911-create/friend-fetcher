import { createFileRoute } from "@tanstack/react-router";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { StoreManager } from "@/components/fitpulse/StoreManager";
import { ProductCard } from "@/components/fitpulse/ProductCard";
import { useStore } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/owner-store")({
  head: () => ({
    meta: [
      { title: "Gym Store Manager — Kool Fit AI" },
      {
        name: "description",
        content: "Add gym-specific products and affiliate links that only your own members can see.",
      },
      { property: "og:title", content: "Gym Store Manager — Kool Fit AI" },
      { property: "og:description", content: "Sell local merch and supplements to your gym's members." },
    ],
  }),
  component: OwnerStorePage,
});

function OwnerStorePage() {
  const { state, currentUser, addProduct, removeProduct } = useStore();
  const products = (state.products ?? []).filter((p) => p.scope === "gym" && p.gymId === currentUser?.gymId);
  const global = (state.products ?? []).filter((p) => p.scope === "global");

  return (
    <AppShell
      role="gym_owner"
      title="Gym store"
      subtitle="Local products for your members, plus the global platform catalogue"
      nav={<OwnerTabs />}
    >
      <StoreManager
        heading="Your gym products"
        description="Visible only to members enrolled under your gym code."
        products={products}
        onAdd={addProduct}
        onRemove={removeProduct}
      />

      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold">Global products (read-only)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Added by the platform admin and shown to every member alongside yours.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {global.length === 0 ? (
            <p className="text-sm text-muted-foreground">No global products yet.</p>
          ) : (
            global.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </GlassCard>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Clock3, MapPin, Phone, MessageCircle } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/fitpulse-store";
import { telHref, waHref } from "@/lib/contact";

export const Route = createFileRoute("/member-gym")({
  head: () => ({
    meta: [
      { title: "Gym info & contacts — Kool Fit AI" },
      {
        name: "description",
        content:
          "Gym timings, directions on Google Maps and one-tap call or WhatsApp to your gym owner and trainer.",
      },
      { property: "og:title", content: "Gym info & contacts — Kool Fit AI" },
      { property: "og:description", content: "Timings, directions and one-tap contact for your gym." },
    ],
  }),
  component: MemberGymPage,
});

function MemberGymPage() {
  const { state, currentUser, currentGym } = useStore();
  const owner = state.users.find((u) => u.role === "gym_owner" && u.gymId === currentUser?.gymId);
  const trainer = state.users.find((u) => u.id === currentUser?.trainerId);
  const ownerPhone = currentGym?.ownerPhone ?? owner?.phone;
  const ownerWa = currentGym?.ownerWhatsapp ?? ownerPhone;
  const trainerPhone = currentGym?.trainerPhone ?? trainer?.phone;
  const trainerWa = currentGym?.trainerWhatsapp ?? trainerPhone;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    currentGym?.address ?? currentGym?.name ?? "gym near me",
  )}`;

  return (
    <AppShell
      role="member"
      title="Gym info & contacts"
      subtitle={currentGym?.name ?? "Your gym"}
      nav={<MemberTabs />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Gym timings</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {currentGym?.timings ?? "Timings not set by your gym yet."}
          </p>
          <p className="mt-3 text-sm">{currentGym?.address ?? "Address not added yet."}</p>
          <Button asChild className="mt-4 w-full">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="size-4" /> Navigate to gym
            </a>
          </Button>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold">Quick contact</h2>
          <p className="mt-1 text-xs text-muted-foreground">One tap to reach your owner or trainer.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ContactButton icon={<Phone className="size-4" />} label="Call Owner" href={telHref(ownerPhone)} />
            <ContactButton
              icon={<MessageCircle className="size-4" />}
              label="WhatsApp Owner"
              href={waHref(ownerWa)}
            />
            <ContactButton icon={<Phone className="size-4" />} label="Call Trainer" href={telHref(trainerPhone)} />
            <ContactButton
              icon={<MessageCircle className="size-4" />}
              label="WhatsApp Trainer"
              href={waHref(trainerWa)}
            />

          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function ContactButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const isWa = label.includes("WhatsApp");
  return (
    <Button
      asChild
      variant={isWa ? undefined : "outline"}
      className={`h-11 w-full gap-2 text-xs ${
        isWa
          ? "bg-emerald-500 text-zinc-950 shadow-none hover:bg-emerald-400"
          : "border-zinc-700 bg-zinc-900 text-foreground shadow-none hover:bg-zinc-800"
      }`}
    >
      <a href={href} target="_blank" rel="noreferrer">
        {icon} {label}
      </a>
    </Button>
  );
}

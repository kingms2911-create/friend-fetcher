import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Phone, UserPlus } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, type LeadStatus } from "@/lib/fitpulse-store";
import { telHref, waHref } from "@/lib/contact";

export const Route = createFileRoute("/owner-leads")({
  head: () => ({
    meta: [
      { title: "Leads & Outreach CRM — Kool Fit AI" },
      {
        name: "description",
        content:
          "Capture gym enquiries, track lead status and start WhatsApp outreach with one tap from the owner CRM.",
      },
      { property: "og:title", content: "Leads & Outreach CRM — Kool Fit AI" },
      { property: "og:description", content: "Capture gym enquiries and follow up on WhatsApp." },
    ],
  }),
  component: OwnerLeads,
});

const statuses: LeadStatus[] = ["new", "contacted", "joined", "lost"];

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-primary/15 text-primary",
  contacted: "bg-chart-3/15 text-chart-3",
  joined: "bg-primary/25 text-primary",
  lost: "bg-destructive/15 text-destructive",
};

function OwnerLeads() {
  const { state, currentUser, currentGym, addLead, setLeadStatus } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const leads = state.leads.filter((l) => l.gymId === currentUser?.gymId);

  return (
    <AppShell
      role="gym_owner"
      title="Leads & outreach"
      subtitle={`${leads.length} enquiries tracked`}
      nav={<OwnerTabs />}
    >
      <GlassCard>
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Capture a lead</h2>
        </div>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.phone.trim()) return;
            addLead({ name: form.name.trim(), phone: form.phone.trim(), note: form.note.trim() });
            setForm({ name: "", phone: "", note: "" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ln">Name</Label>
            <Input id="ln" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lp">Phone</Label>
            <Input id="lp" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lo">Note</Label>
            <Input id="lo" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit">Add lead</Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        <div className="mt-4 space-y-3">
          {leads.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No leads yet. Add walk-ins and enquiries above.
            </p>
          ) : (
            leads.map((l) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-secondary p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.phone} · {l.note || "no notes"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[l.status]}`}>
                    {l.status}
                  </span>
                  <Button asChild size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 shadow-none hover:bg-zinc-800">
                    <a href={telHref(l.phone)}>
                      <Phone className="size-4" />
                    </a>
                  </Button>
                  <Button asChild size="sm" className="bg-emerald-500 text-zinc-950 shadow-none hover:bg-emerald-400">
                    <a
                      href={waHref(
                        l.phone,
                        `Hi ${l.name}, this is ${currentGym?.name ?? "our gym"} — thanks for your interest! Want to drop by for a free trial?`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setLeadStatus(l.id, s)}
                      className={`rounded-full border px-2.5 py-1 text-xs capitalize transition-colors ${
                        l.status === s
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </AppShell>
  );
}

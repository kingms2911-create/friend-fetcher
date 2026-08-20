import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const base =
  "shrink-0 rounded-full border border-border/60 bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground";
const active = { className: `${base} border-primary/60 bg-primary/15 text-primary` };
const inactive = { className: base };

function Bar({ children }: { children: ReactNode }) {
  return <nav className="flex gap-2">{children}</nav>;
}

export function OwnerTabs() {
  return (
    <Bar>
      <Link to="/gym-owner" activeProps={active} inactiveProps={inactive} activeOptions={{ exact: true }}>
        Overview
      </Link>
      <Link to="/owner-members" activeProps={active} inactiveProps={inactive}>
        Members
      </Link>
      <Link to="/owner-plans" activeProps={active} inactiveProps={inactive}>
        AI Plans
      </Link>
      <Link to="/owner-attendance" activeProps={active} inactiveProps={inactive}>
        Attendance
      </Link>
      <Link to="/owner-leads" activeProps={active} inactiveProps={inactive}>
        Leads CRM
      </Link>
      <Link to="/owner-store" activeProps={active} inactiveProps={inactive}>
        Store
      </Link>
    </Bar>
  );
}

export function MemberTabs() {
  return (
    <Bar>
      <Link to="/member-portal" activeProps={active} inactiveProps={inactive} activeOptions={{ exact: true }}>
        Today
      </Link>
      <Link to="/member-plan" activeProps={active} inactiveProps={inactive}>
        My AI Plan
      </Link>
      <Link to="/member-health" activeProps={active} inactiveProps={inactive}>
        Health &amp; Recovery
      </Link>
      <Link to="/member-store" activeProps={active} inactiveProps={inactive}>
        Gym Store
      </Link>
      <Link to="/member-gym" activeProps={active} inactiveProps={inactive}>
        Gym &amp; Contact
      </Link>
    </Bar>
  );
}


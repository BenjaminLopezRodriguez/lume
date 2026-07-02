import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";

const BUSINESS_SETTINGS = [
  { label: "Store profile", trailing: "Rosemary Bistro", dot: "#6366f1" },
  { label: "Payouts", trailing: "•••• 4821", dot: "#22c55e" },
] as const;

const ACCOUNT_SETTINGS = [
  { label: "Personal info", trailing: "Maria Rodriguez", dot: "#f59e0b" },
  { label: "Notifications", trailing: "On", dot: "#e85d9b" },
] as const;

const ALERTS = [
  { label: "New order alerts", trailing: "On", dot: "#22c55e" },
  { label: "Guest issue alerts", trailing: "On", dot: "#f59e0b" },
  { label: "Daily summary", trailing: "Off", dot: "#d4d4d4" },
] as const;

export default function SettingsPage() {
  return (
    <PageContent>
      <PageHeader
        title="Settings"
        meta={
          <>
            <span className="text-neutral-700">Maria Rodriguez</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">maria@rosemarybistro.com</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Business" />
          <ListCard>
            {BUSINESS_SETTINGS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Account" />
          <ListCard>
            {ACCOUNT_SETTINGS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Alerts" />
          <ListCard
            footer={{
              label: "Sign out →",
              href: "/m/settings",
            }}
          >
            {ALERTS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}

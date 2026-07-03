import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { SectionHeader } from "@/app/m/_components/section-header";

const OUT_PLATFORMS = [
  { id: "zapier", label: "Zapier", dot: "#ff4a00", desc: "Automate workflows with 6,000+ apps" },
  { id: "google", label: "Google Workspace", dot: "#4285f4", desc: "Sync contacts and calendar events" },
  { id: "slack", label: "Slack", dot: "#611f69", desc: "Send notifications to your team" },
  { id: "webhooks", label: "Webhooks", dot: "#6366f1", desc: "POST events to any custom endpoint" },
] as const;

export default function ConnectOutPage() {
  return (
    <PageContent>
      <PageHeader
        title="Connect Out"
        meta="Let other apps subscribe to Lume events and data"
      />
      <div className="mt-8 flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Outbound integrations" />
          <ListCard>
            {OUT_PLATFORMS.map((p) => (
              <ListCardRow
                key={p.id}
                dot={p.dot}
                label={p.label}
                trailing={p.desc}
              />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}

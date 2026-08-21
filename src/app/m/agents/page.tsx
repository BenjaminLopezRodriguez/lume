import { AgentsPageView } from "@/app/m/_components/agents-page-view";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";

export default function AgentsPage() {
  return (
    <PageContent width="full">
      <PageHeader
        title="Agents"
        meta="Sell through AI assistants — let compatible assistants discover your products and help customers buy from you."
      />
      <AgentsPageView />
    </PageContent>
  );
}

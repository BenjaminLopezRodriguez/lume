import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { OwnershipPageView } from "@/app/m/_components/ownership-page-view";

export default function OwnershipPage() {
  return (
    <PageContent width="full">
      <PageHeader
        title="Customers"
        meta="Everyone who has bought from your business"
      />
      <OwnershipPageView />
    </PageContent>
  );
}

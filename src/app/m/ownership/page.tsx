import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { OwnershipPageView } from "@/app/m/_components/ownership-page-view";

export default function OwnershipPage() {
  return (
    <PageContent>
      <PageHeader
        title="Ownership"
        meta="All customer relationships for your account"
      />
      <OwnershipPageView />
    </PageContent>
  );
}

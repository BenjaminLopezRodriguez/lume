import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SupportPageView } from "@/app/m/_components/support-page-view";

export default function SupportPage() {
  return (
    <PageContent>
      <PageHeader
        title="Support"
        meta="Pending actions and customer issues across your accounts"
      />
      <SupportPageView />
    </PageContent>
  );
}

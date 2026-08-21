import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { OrdersPageView } from "@/app/m/_components/orders-page-view";

export default function OrdersPage() {
  return (
    <PageContent width="full">
      <PageHeader
        title="Orders"
        meta="Every order, from every way you sell"
      />
      <OrdersPageView />
    </PageContent>
  );
}

import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";

const PRODUCTS = [
  { label: "House olive oil", trailing: "$18.00", dot: "#6366f1" },
  { label: "Sourdough loaf", trailing: "$9.50", dot: "#22c55e" },
  { label: "Gift card", trailing: "$50.00", dot: "#f59e0b" },
] as const;

export default function StorePage() {
  return (
    <PageContent>
      <PageHeader
        title="Store"
        meta={
          <>
            <span className="text-neutral-700">3 products</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">Link-based checkout for retail</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Products" />
          <ListCard
            footer={{
              label: "Add product →",
              href: "/m/store",
            }}
          >
            {PRODUCTS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}

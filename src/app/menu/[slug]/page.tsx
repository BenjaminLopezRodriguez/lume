// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Public menu page at /menu/[slug] with table param + order & pay.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { businesses, menus } from "@/server/db/schema";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table } = await searchParams;

  const menu = await db.query.menus.findFirst({
    where: eq(menus.slug, slug),
  });

  if (!menu) notFound();

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, menu.businessId),
  });

  if (!business) notFound();

  const categories = [
    ...new Set(menu.items.map((item) => item.category ?? "Menu")),
  ];

  return (
    <main className="min-h-dvh bg-[#faf8f6] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {table ? `Table ${table}` : "Dine-in menu"}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-950">{menu.name}</h1>
          <p className="mt-2 text-sm text-neutral-500">{business.name}</p>
        </header>

        {categories.length > 0 ? (
          categories.map((category) => {
            const items = menu.items.filter(
              (item) => (item.category ?? "Menu") === category,
            );
            return (
              <section key={category} className="mb-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {category}
                </h2>
                <ul className="divide-y divide-[#ebebeb] overflow-hidden rounded-xl border border-[#ebebeb] bg-white">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="text-sm text-neutral-500">{item.description}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-neutral-900">
                        ${(item.priceCents / 100).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        ) : (
          <div className="rounded-xl border border-[#ebebeb] bg-white px-5 py-10 text-center text-sm text-neutral-500">
            No menu items yet.
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-[#ebebeb] bg-white p-5 text-center">
          <p className="text-sm text-neutral-600">
            Ready to order? Checkout is powered by Lume — ownership starts when you pay.
          </p>
          {business.stripePaymentLinkUrl ? (
            <a
              href={business.stripePaymentLinkUrl}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "#e85d04" }}
            >
              Order & pay
            </a>
          ) : (
            <p className="mt-4 text-sm text-neutral-400">Checkout coming soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}

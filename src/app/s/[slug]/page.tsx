import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { storefronts } from "@/server/db/schema";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const storefront = await db.query.storefronts.findFirst({
    where: eq(storefronts.slug, slug),
    with: { products: true, business: true },
  });

  if (!storefront) notFound();

  return (
    <main className="min-h-dvh bg-[#faf8f6] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Lume Storefront
          </p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-950">{storefront.name}</h1>
        </header>

        <ul className="divide-y divide-[#ebebeb] overflow-hidden rounded-xl border border-[#ebebeb] bg-white">
          {storefront.products.length > 0 ? (
            storefront.products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{product.name}</p>
                  {product.description ? (
                    <p className="text-sm text-neutral-500">{product.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-neutral-400">
                    {product.inventory > 0 ? "In stock" : "Out of stock"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    ${(product.priceCents / 100).toFixed(2)}
                  </span>
                  {product.stripePaymentLinkUrl && product.inventory > 0 ? (
                    <a
                      href={product.stripePaymentLinkUrl}
                      className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white"
                      style={{ backgroundColor: "#6366f1" }}
                    >
                      Checkout
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">Unavailable</span>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="px-5 py-10 text-center text-sm text-neutral-500">
              No products listed yet.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

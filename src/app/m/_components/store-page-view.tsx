"use client";

import { useEffect, useState } from "react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentStatusChip } from "@/verticals/shared/payment-status-chip";
import { VERTICAL_CONFIG } from "@/verticals/types";
import { api } from "@/trpc/react";

export function StorePageView() {
  const { activeBusiness, getBusinessByType } = useBusinesses();
  const storeBusiness = getBusinessByType("store");
  const businessId = storeBusiness?.id ?? activeBusiness?.id;
  const accent = VERTICAL_CONFIG.store.accent;

  const utils = api.useUtils();
  const { data: storefront } = api.store.getStorefront.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );
  const { data: products = [] } = api.store.listProducts.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );

  const ensureStorefront = api.store.ensureStorefront.useMutation({
    onSuccess: async () => {
      await utils.store.invalidate();
    },
  });

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  const createProduct = api.store.createProduct.useMutation({
    onSuccess: async () => {
      await utils.store.invalidate();
      setProductName("");
      setProductPrice("");
    },
  });

  useEffect(() => {
    if (
      businessId &&
      storeBusiness &&
      !storefront &&
      !ensureStorefront.isPending &&
      !ensureStorefront.isSuccess
    ) {
      void ensureStorefront.mutate({
        businessId,
        name: storeBusiness.name,
      });
    }
  }, [
    businessId,
    storeBusiness,
    storefront,
    ensureStorefront.isPending,
    ensureStorefront.isSuccess,
    ensureStorefront,
  ]);

  const storefrontUrl = storefront
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${storefront.slug}`
    : null;

  return (
    <PageContent>
      <PageHeader
        title={storeBusiness?.name ?? "Store"}
        meta={
          storefrontUrl ? (
            <>
              <span className="text-neutral-700">StorefrontEndpoint</span>
              <span className="text-neutral-400"> · </span>
              <span className="truncate text-neutral-500">{storefrontUrl}</span>
            </>
          ) : (
            <span className="text-neutral-500">
              Catalog checkout — add products and share your storefront
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph label="Sales this week" color={accent} />
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Add product" />
          <form
            className="flex flex-col gap-3 rounded-xl border border-[#ebebeb] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const cents = Math.round(parseFloat(productPrice) * 100);
              if (!businessId || !productName.trim() || !cents) return;
              createProduct.mutate({
                businessId,
                name: productName.trim(),
                priceCents: cents,
                inventory: 10,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-name">Product name</Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="House olive oil"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step={0.01}
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="18.00"
                className="h-10 rounded-lg"
              />
            </div>
            <Button
              type="submit"
              className="h-10 rounded-lg"
              disabled={createProduct.isPending || !businessId}
            >
              {createProduct.isPending ? "Adding..." : "Add product"}
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Products" />
          <ListCard footer={{ label: "Copy checkout links →", href: "/m/share" }}>
            {products.length > 0 ? (
              products.map((product) => (
                <ListCardRow
                  key={product.id}
                  dot={product.inventory > 0 ? "#22c55e" : "#ef4444"}
                  label={product.name}
                  trailing={`$${(product.priceCents / 100).toFixed(2)}`}
                />
              ))
            ) : (
              <ListCardRow
                dot="#a3a3a3"
                label="No products yet"
                trailing="Add your first SKU"
              />
            )}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}

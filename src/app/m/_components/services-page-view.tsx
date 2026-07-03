"use client";

import { useState } from "react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentStatusChip } from "@/verticals/shared/payment-status-chip";
import { VERTICAL_CONFIG } from "@/verticals/types";
import { api } from "@/trpc/react";

export function ServicesPageView() {
  const { activeBusiness, getBusinessByType } = useBusinesses();
  const servicesBusiness = getBusinessByType("services");
  const businessId = servicesBusiness?.id ?? activeBusiness?.id;
  const accent = VERTICAL_CONFIG.services.accent;

  const utils = api.useUtils();
  const { data: jobs = [] } = api.services.listJobs.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );

  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [lineLabel, setLineLabel] = useState("");
  const [lineAmount, setLineAmount] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const createJob = api.services.createJob.useMutation({
    onSuccess: async () => {
      await utils.services.invalidate();
      setClientName("");
      setTitle("");
    },
  });

  const createInvoice = api.services.createInvoice.useMutation({
    onSuccess: async () => {
      await utils.services.invalidate();
      setLineLabel("");
      setLineAmount("");
      setSelectedJobId(null);
    },
  });

  return (
    <PageContent>
      <PageHeader
        title={servicesBusiness?.name ?? "Services"}
        meta="Lawn care, plumbing, creative work — invoice when the job is done."
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="New job" />
          <form
            className="flex flex-col gap-3 rounded-xl border border-[#ebebeb] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!businessId || !clientName.trim() || !title.trim()) return;
              createJob.mutate({
                businessId,
                clientName: clientName.trim(),
                title: title.trim(),
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-name">Client name</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jane Smith"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lawn mowing · weekly"
                className="h-10 rounded-lg"
              />
            </div>
            <Button
              type="submit"
              className="h-10 rounded-lg"
              disabled={createJob.isPending || !businessId}
            >
              {createJob.isPending ? "Creating..." : "Create job"}
            </Button>
          </form>
        </section>

        {selectedJobId ? (
          <section className="flex flex-col gap-3">
            <SectionHeader title="InvoiceCheckout" />
            <form
              className="flex flex-col gap-3 rounded-xl border border-[#ebebeb] bg-white p-5"
              onSubmit={(event) => {
                event.preventDefault();
                const cents = Math.round(parseFloat(lineAmount) * 100);
                if (!selectedJobId || !lineLabel.trim() || !cents) return;
                createInvoice.mutate({
                  jobId: selectedJobId,
                  lineItems: [
                    { label: lineLabel.trim(), amountCents: cents, quantity: 1 },
                  ],
                });
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="line-label">Line item</Label>
                <Input
                  id="line-label"
                  value={lineLabel}
                  onChange={(e) => setLineLabel(e.target.value)}
                  placeholder="Lawn mowing service"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="line-amount">Amount ($)</Label>
                <Input
                  id="line-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={lineAmount}
                  onChange={(e) => setLineAmount(e.target.value)}
                  placeholder="75.00"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setSelectedJobId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? "Sending..." : "Send invoice"}
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <SectionHeader title="Jobs" />
          <ListCard footer={{ label: "Share invoice link →", href: "/m/share" }}>
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const latestInvoice = job.invoices[0];
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <ListCardRow
                      dot={accent}
                      label={`${job.clientName} · ${job.title}`}
                      trailing={
                        latestInvoice
                          ? `$${(latestInvoice.totalCents / 100).toFixed(2)}`
                          : "No invoice"
                      }
                      className="flex-1 px-0 py-0"
                    />
                    <div className="flex shrink-0 items-center gap-2">
                      <PaymentStatusChip status={job.status} />
                      {!latestInvoice && job.status !== "completed" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg"
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          Invoice
                        </Button>
                      ) : latestInvoice ? (
                        <PaymentStatusChip status={latestInvoice.status} />
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <ListCardRow
                dot="#a3a3a3"
                label="No jobs yet"
                trailing="Create one above"
              />
            )}
          </ListCard>
        </section>
      </div>
        </TabsContent>
        <TabsContent value="issues">
          <div className="mt-6 flex flex-col gap-3">
            <ListCard>
              <ListCardRow dot="#a3a3a3" label="No issues" trailing="Coming soon" />
            </ListCard>
          </div>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}

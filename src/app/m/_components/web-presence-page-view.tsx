"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Web presence UI (Lume site URL, custom domain 3-step DNS wizard).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { useEffect, useRef, useState } from "react";
import {
  ArrowSquareOut,
  Check,
  CheckCircle,
  Copy,
  Globe,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const VERCEL_A_RECORD = "76.76.21.21";

const DOMAIN_STEPS = [
  { id: 1, label: "Your domain" },
  { id: 2, label: "DNS records" },
  { id: 3, label: "Go live" },
] as const;

export function WebPresencePageView({ userEmail }: { userEmail: string }) {
  const { activeBusiness } = useBusinesses();
  const utils = api.useUtils();
  const businessId = activeBusiness?.id ?? "";
  const reminderToastShown = useRef(false);

  const { data: presence, isLoading } = api.presence.get.useQuery(
    { businessId },
    { enabled: !!businessId },
  );

  const connectMutation = api.presence.connectDomain.useMutation({
    onSuccess: async () => {
      await utils.presence.invalidate();
      setStep(2);
    },
  });

  const verifyMutation = api.presence.verifyDomain.useMutation({
    onSuccess: async () => {
      await utils.presence.invalidate();
      setStep(3);
    },
  });

  const disconnectMutation = api.presence.disconnectDomain.useMutation({
    onSuccess: async () => {
      await utils.presence.invalidate();
      setDomainInput("");
      setStep(1);
    },
  });

  const reminderMutation = api.presence.scheduleReminder.useMutation();

  const [step, setStep] = useState(1);
  const [domainInput, setDomainInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (presence?.domainStatus === "pending_dns" && presence.customDomain) {
      setDomainInput(presence.customDomain);
      setStep(2);
    }
  }, [presence?.customDomain, presence?.domainStatus]);

  useEffect(() => {
    if (step !== 2 || reminderToastShown.current || !userEmail || !businessId) return;
    reminderToastShown.current = true;
    toast("DNS can take up to an hour to propagate.", {
      description: "Want an email reminder to come back and verify?",
      duration: 12000,
      action: {
        label: "Remind me",
        onClick: () => {
          reminderMutation.mutate({ businessId, email: userEmail });
          toast.success("Reminder set — we'll email you in ~1 hour.");
        },
      },
    });
  }, [step, userEmail, businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.onlume.co";
  const lumeUrl = presence ? `${origin}/w/${presence.slug}` : null;
  const customDomain = presence?.customDomain ?? null;
  const domainActive = presence?.domainStatus === "active";
  const domainPending = presence?.domainStatus === "pending_dns";

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  }

  function handleConnectDomain() {
    if (!businessId || !domainInput.trim()) return;
    connectMutation.mutate({ businessId, domain: domainInput.trim() });
  }

  function handleVerify() {
    if (!businessId) return;
    verifyMutation.mutate({ businessId });
  }

  if (!activeBusiness) {
    return (
      <PageContent>
        <PageHeader
          title="Entry Points"
          meta="Connect a domain — Lume hosts your site"
        />
        <div className="mt-8 rounded-xl border border-[#ebebeb] bg-white px-5 py-8 text-center">
          <p className="text-sm text-neutral-500">
            Create a business to set up your web presence.
          </p>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title="Entry Points"
        meta={
          domainActive && customDomain ? (
            <>
              <span className="text-neutral-700">{customDomain}</span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">Lume hosts your site</span>
            </>
          ) : (
            <span className="text-neutral-500">
              Connect a domain — Lume hosts your site
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Your Lume site" />
          <div className="rounded-xl border border-[#ebebeb] bg-white p-5">
            <div className="flex items-start gap-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e2f1af]"
                aria-hidden
              >
                <Globe size={20} className="text-neutral-800" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-950">
                  {activeBusiness.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  Lume builds and hosts your public website — menu, catalog, tickets,
                  or checkout — so you don&apos;t need a separate site builder.
                </p>
                {lumeUrl ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-neutral-700">
                      {lumeUrl}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg border-[#ebebeb] px-3"
                      onClick={() => copyText(lumeUrl, "lume")}
                    >
                      {copied === "lume" ? (
                        <>
                          <Check size={14} aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} aria-hidden />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg border-[#ebebeb] px-3"
                      asChild
                    >
                      <a href={lumeUrl} target="_blank" rel="noopener noreferrer">
                        <ArrowSquareOut size={14} aria-hidden />
                        Preview
                      </a>
                    </Button>
                  </div>
                ) : isLoading ? (
                  <p className="mt-4 text-sm text-neutral-400">Loading…</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Custom domain" />

          {domainActive && customDomain ? (
            <div className="rounded-xl border border-[#ebebeb] bg-white px-5 py-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#e2f1af] text-neutral-800">
                <CheckCircle size={28} weight="fill" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-neutral-950">
                {customDomain} is live
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Visitors can reach your Lume-hosted site at your own domain.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-[#ebebeb]"
                  asChild
                >
                  <a
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut size={14} aria-hidden />
                    Visit site
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-[#ebebeb] text-neutral-500"
                  onClick={() => disconnectMutation.mutate({ businessId })}
                  disabled={disconnectMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <ol className="flex items-center gap-2">
                {DOMAIN_STEPS.map(({ id, label }, index) => {
                  const complete = step > id;
                  const active = step === id;

                  return (
                    <li key={id} className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex min-w-0 flex-col items-center gap-1.5">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            complete && "bg-neutral-900 text-white",
                            active && !complete && "bg-[#6366f1] text-white",
                            !active && !complete && "bg-[#f5f5f5] text-neutral-500",
                          )}
                        >
                          {complete ? (
                            <Check size={14} weight="bold" aria-hidden />
                          ) : (
                            id
                          )}
                        </span>
                        <span
                          className={cn(
                            "hidden text-center text-[0.625rem] font-medium sm:block",
                            active ? "text-neutral-900" : "text-neutral-400",
                          )}
                        >
                          {label}
                        </span>
                      </div>
                      {index < DOMAIN_STEPS.length - 1 ? (
                        <span
                          className={cn(
                            "mb-4 h-px flex-1",
                            step > id ? "bg-neutral-900" : "bg-[#ebebeb]",
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              <div className="rounded-xl border border-[#ebebeb] bg-white p-5">
                {step === 1 ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">
                        Connect your domain
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                        Point your domain to Lume and we&apos;ll serve your website —
                        no hosting setup required.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="custom-domain" className="text-sm text-neutral-700">
                        Domain name
                      </label>
                      <Input
                        id="custom-domain"
                        placeholder="yourbusiness.com"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        className="h-10 rounded-lg border-[#ebebeb] bg-white px-3 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConnectDomain();
                        }}
                      />
                      {connectMutation.error ? (
                        <p className="text-sm text-red-600">
                          {connectMutation.error.message}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
                      onClick={handleConnectDomain}
                      disabled={!domainInput.trim() || connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "Saving…" : "Continue"}
                    </Button>
                    {domainPending && customDomain ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-lg border-[#ebebeb]"
                        onClick={() => {
                          setDomainInput(customDomain);
                          setStep(2);
                        }}
                      >
                        Resume setup for {customDomain}
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 && (customDomain || domainInput) ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">
                        Add DNS records
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                        In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.),
                        add these records for{" "}
                        <span className="font-medium text-neutral-800">
                          {customDomain ?? domainInput}
                        </span>
                        .
                      </p>
                    </div>
                    <ListCard>
                      <ListCardRow
                        label={
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                              A record
                            </span>
                            <span>@ → {VERCEL_A_RECORD}</span>
                          </div>
                        }
                        trailing={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-neutral-500"
                            onClick={() => copyText(VERCEL_A_RECORD, "a")}
                          >
                            {copied === "a" ? "Copied" : "Copy"}
                          </Button>
                        }
                      />
                    </ListCard>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-neutral-400">
                        DNS changes can take up to an hour to propagate globally.
                      </p>
                      <p className="text-xs text-neutral-400">
                        <span className="font-medium text-neutral-500">Using Cloudflare?</span>{" "}
                        Set the record to DNS only (grey cloud icon) — proxied mode will block verification.
                      </p>
                    </div>
                    {verifyMutation.error ? (
                      <p className="text-sm text-red-600">
                        {verifyMutation.error.message}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 rounded-lg border-[#ebebeb]"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="h-10 flex-1 rounded-lg bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
                        onClick={handleVerify}
                        disabled={verifyMutation.isPending}
                      >
                        {verifyMutation.isPending ? "Checking…" : "Verify DNS"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {step === 3 && !domainActive ? (
                  <div className="flex flex-col gap-4 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e2f1af] text-neutral-800">
                      <CheckCircle size={28} weight="fill" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">
                        Domain connected
                      </h3>
                      <p className="mt-2 text-sm text-neutral-500">
                        Lume is now serving your website at{" "}
                        <span className="font-medium text-neutral-800">
                          {customDomain}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="What Lume handles" />
          <ListCard>
            <ListCardRow
              dot="#6366f1"
              label="Website design & hosting"
              trailing="Included"
            />
            <ListCardRow
              dot="#22c55e"
              label="SSL certificate"
              trailing="Automatic"
            />
            <ListCardRow
              dot="#e85d04"
              label="Checkout & ownership"
              trailing="Built in"
            />
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}

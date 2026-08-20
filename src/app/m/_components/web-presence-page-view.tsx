"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Web presence UI (Lume site URL, custom domain 3-step DNS wizard).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { useEffect, useRef, useState } from "react";
import {
  ArrowSquareOut,
  CaretDown,
  Check,
  CheckCircle,
  Copy,
  Globe,
  PencilSimple,
  Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { CreateSiteDialog } from "@/app/m/_components/create-site-dialog";
import { SiteEditorOverlay } from "@/app/m/_components/site-editor-overlay";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const VERCEL_A_RECORD = "76.76.21.21";
const VERCEL_CNAME = "cname.vercel-dns.com";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);

  useEffect(() => {
    if (presence?.domainStatus === "pending_dns" && presence.customDomain) {
      setDomainInput(presence.customDomain);
      setStep(2);
      setDomainOpen(true);
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
  const hasSite = !!presence?.layout;

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
        <PageHeader title="Channels" meta="Your website — hosted by Lume" />
        <div className="mt-8 rounded-xl border border-border bg-card px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Create a business to set up your website.
          </p>
        </div>
      </PageContent>
    );
  }

  return (
    <>
    <PageContent>
      <PageHeader
        title="Channels"
        meta={
          domainActive && customDomain ? (
            <>
              <span className="text-foreground/70">{customDomain}</span>
              <span className="text-muted-foreground/70"> · </span>
              <span className="text-muted-foreground">Lume hosts your site</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Your website — hosted by Lume
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <CreateSiteDialog
          businessId={businessId}
          onEditSite={() => setEditorOpen(true)}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />

        {!hasSite ? (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Website" />
            <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Globe size={28} className="text-muted-foreground/70" aria-hidden />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Create a storefront powered by your Lume catalog.
              </p>
              <Button
                type="button"
                className="mt-4 h-11 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={14} weight="bold" aria-hidden />
                Create website
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <SectionHeader title="Website" />
              <div className="rounded-xl border border-border bg-card px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {activeBusiness.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full bg-[var(--success)]"
                        aria-hidden
                      />
                      Live
                    </span>
                    {lumeUrl ? (
                      <span className="truncate text-sm text-muted-foreground">
                        {lumeUrl}
                      </span>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      Custom domain:{" "}
                      {domainActive && customDomain
                        ? customDomain
                        : domainPending && customDomain
                          ? `${customDomain} (pending DNS)`
                          : "Not connected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lumeUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-lg border-border px-3"
                        asChild
                      >
                        <a href={lumeUrl} target="_blank" rel="noopener noreferrer">
                          <ArrowSquareOut size={13} aria-hidden />
                          Open site
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 rounded-lg border-border px-3"
                      onClick={() => setEditorOpen(true)}
                    >
                      <PencilSimple size={13} aria-hidden />
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col">
            <section className="flex flex-col gap-3">
              <SectionHeader title="Configuration" />
              <ListCard>
                <ListCardRow
                  label="Domain"
                  trailing={
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm text-muted-foreground">
                        {customDomain ?? ""}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-lg border-border px-3"
                        aria-expanded={domainOpen}
                        aria-controls="custom-domain-panel"
                        onClick={() => setDomainOpen((v) => !v)}
                      >
                        {customDomain ? "Manage" : "Connect"}
                        <CaretDown
                          size={13}
                          aria-hidden
                          className={cn(
                            "transition-transform duration-[var(--duration-standard)] ease-[var(--ease-move)]",
                            domainOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </span>
                  }
                />
                <ListCardRow
                  label="Theme"
                  trailing={
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Default</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-lg border-border px-3"
                        onClick={() => setEditorOpen(true)}
                      >
                        Customize
                      </Button>
                    </span>
                  }
                />
              </ListCard>
            </section>
            <div
              id="custom-domain-panel"
              className="motion-disclosure"
              data-open={domainOpen}
            >
              <div inert={!domainOpen}>
          <section className="flex flex-col gap-3 pt-8">
          <SectionHeader title="Custom domain" />

          {domainActive && customDomain ? (
            <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <CheckCircle size={28} weight="fill" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {customDomain} is live
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Visitors can reach your Lume-hosted site at your own domain.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-border"
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
                  className="h-9 rounded-lg border-border text-muted-foreground"
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
                            complete && "bg-primary text-primary-foreground",
                            active && !complete && "bg-accent text-accent-foreground ring-2 ring-primary/30",
                            !active && !complete && "bg-muted text-muted-foreground",
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
                            active ? "text-foreground" : "text-muted-foreground/70",
                          )}
                        >
                          {label}
                        </span>
                      </div>
                      {index < DOMAIN_STEPS.length - 1 ? (
                        <span
                          className={cn(
                            "mb-4 h-px flex-1",
                            step > id ? "bg-primary" : "bg-border",
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              <div className="rounded-xl border border-border bg-card p-5">
                {step === 1 ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Connect your domain
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Point your domain to Lume and we&apos;ll serve your website —
                        no hosting setup required.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="custom-domain" className="text-sm text-foreground/70">
                        Domain name
                      </label>
                      <Input
                        id="custom-domain"
                        placeholder="yourbusiness.com"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        className="h-10 rounded-lg border-border bg-card px-3 text-sm"
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
                      className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      onClick={handleConnectDomain}
                      disabled={!domainInput.trim() || connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "Saving…" : "Continue"}
                    </Button>
                    {domainPending && customDomain ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-lg border-border"
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
                      <h3 className="text-base font-semibold text-foreground">
                        Add DNS records
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.),
                        add these records for{" "}
                        <span className="font-medium text-foreground/80">
                          {customDomain ?? domainInput}
                        </span>
                        .
                      </p>
                    </div>
                    <ListCard>
                      <ListCardRow
                        label={
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
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
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => copyText(VERCEL_A_RECORD, "a")}
                          >
                            {copied === "a" ? "Copied" : "Copy"}
                          </Button>
                        }
                      />
                      <ListCardRow
                        label={
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                              CNAME record
                            </span>
                            <span>www → {VERCEL_CNAME}</span>
                          </div>
                        }
                        trailing={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => copyText(VERCEL_CNAME, "cname")}
                          >
                            {copied === "cname" ? "Copied" : "Copy"}
                          </Button>
                        }
                      />
                    </ListCard>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-muted-foreground/70">
                        DNS changes can take up to an hour to propagate globally.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        <span className="font-medium text-muted-foreground">Using Cloudflare?</span>{" "}
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
                        className="h-10 flex-1 rounded-lg border-border"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
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
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <CheckCircle size={28} weight="fill" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Domain connected
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Lume is now serving your website at{" "}
                        <span className="font-medium text-foreground/80">
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
              </div>
            </div>
            </div>
          </>
        )}

        {hasSite ? (
        <section className="flex flex-col gap-3">
          <SectionHeader title="What Lume handles" />
          <ListCard>
            <ListCardRow
              dot="var(--chart-1)"
              label="Website design & hosting"
              trailing="Included"
            />
            <ListCardRow
              dot="var(--success)"
              label="SSL certificate"
              trailing="Automatic"
            />
            <ListCardRow
              dot="var(--chart-2)"
              label="Checkout & ownership"
              trailing="Built in"
            />
          </ListCard>
        </section>
        ) : null}
      </div>
    </PageContent>
    <SiteEditorOverlay
      open={editorOpen}
      onClose={() => setEditorOpen(false)}
      businessId={businessId}
      presence={presence}
    />
    </>
  );
}

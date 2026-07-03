"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Full QR wizard (menu/web/checkout/storefront/tickets) driven by account capabilities.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  accountHasMenuCapability,
  QR_CAPABILITY_CONFIG,
  type QrCapabilityId,
} from "@/lib/qr-capabilities";
import { api, type RouterOutputs } from "@/trpc/react";

type WizardStep = "list" | "capability" | "configure" | "label" | "result";
type QrCode = RouterOutputs["qr"]["list"][number];
type CreatedQr = RouterOutputs["qr"]["create"];

const MENU_ACCENT = "#e85d04";

const CAPABILITY_DOT: Record<QrCapabilityId, string> = {
  menu: MENU_ACCENT,
  web: "#2d5be3",
  checkout: "#22c55e",
  storefront: "#6366f1",
  tickets: "#e85d9b",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function capabilityLabel(id: string) {
  const config = QR_CAPABILITY_CONFIG[id as QrCapabilityId];
  return config?.label ?? id;
}

function defaultLabel(capability: QrCapabilityId, tableLabel?: string) {
  switch (capability) {
    case "menu":
      return tableLabel?.trim() || "Menu";
    case "web":
      return "Website";
    case "checkout":
      return "Checkout";
    case "storefront":
      return "Storefront";
    case "tickets":
      return "Tickets";
  }
}

function resetWizardState() {
  return {
    selectedCapability: null as QrCapabilityId | null,
    tableLabel: "",
    webTargetId: "lume" as "lume" | "custom",
    label: "",
    createdQr: null as CreatedQr | null,
    viewingQr: null as QrCode | null,
  };
}

export function QrPresencePageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id ?? "";
  const utils = api.useUtils();

  const [step, setStep] = useState<WizardStep>("list");
  const [selectedCapability, setSelectedCapability] =
    useState<QrCapabilityId | null>(null);
  const [tableLabel, setTableLabel] = useState("");
  const [webTargetId, setWebTargetId] = useState<"lume" | "custom">("lume");
  const [label, setLabel] = useState("");
  const [createdQr, setCreatedQr] = useState<CreatedQr | null>(null);
  const [viewingQr, setViewingQr] = useState<QrCode | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: accountCaps = [] } = api.capabilitySet.listForBusiness.useQuery(
    { businessId },
    { enabled: !!businessId },
  );

  const { data: capabilities = [] } = api.qr.listCapabilities.useQuery(
    { businessId },
    { enabled: !!businessId },
  );

  const { data: existingQrs = [], isLoading: listLoading } = api.qr.list.useQuery(
    { businessId },
    { enabled: !!businessId },
  );

  const { data: menu } = api.menu.get.useQuery(
    { businessId },
    {
      enabled:
        !!businessId &&
        (selectedCapability === "menu" || accountHasMenuCapability(accountCaps)),
    },
  );

  const { data: webTargets = [] } = api.qr.getWebTargets.useQuery(
    { businessId },
    { enabled: !!businessId && selectedCapability === "web" && step === "configure" },
  );

  const createQr = api.qr.create.useMutation({
    onSuccess: async (created) => {
      setCreatedQr(created);
      setViewingQr(null);
      setStep("result");
      await utils.qr.list.invalidate({ businessId });
    },
  });

  const removeQr = api.qr.remove.useMutation({
    onSuccess: async () => {
      await utils.qr.list.invalidate({ businessId });
      if (viewingQr) {
        goToList();
      }
    },
  });

  const hasMenu = accountHasMenuCapability(accountCaps);
  const activeQr = createdQr ?? viewingQr;
  const activeUrl = activeQr?.targetUrl ?? "";

  const menuPreviewItems = useMemo(
    () => (menu?.items ?? []).slice(0, 4),
    [menu?.items],
  );

  useEffect(() => {
    if (step === "label" && selectedCapability && !label.trim()) {
      setLabel(defaultLabel(selectedCapability, tableLabel));
    }
  }, [step, selectedCapability, tableLabel, label]);

  function goToList() {
    const reset = resetWizardState();
    setStep("list");
    setSelectedCapability(reset.selectedCapability);
    setTableLabel(reset.tableLabel);
    setWebTargetId(reset.webTargetId);
    setLabel(reset.label);
    setCreatedQr(reset.createdQr);
    setViewingQr(reset.viewingQr);
    createQr.reset();
  }

  function startCreate(capability: QrCapabilityId) {
    setSelectedCapability(capability);
    setCreatedQr(null);
    setViewingQr(null);
    setLabel(defaultLabel(capability, tableLabel));
    if (capability === "menu" || capability === "web") {
      setStep("configure");
      return;
    }
    setStep("label");
  }

  function selectCapability(capability: QrCapabilityId) {
    startCreate(capability);
  }

  function openExisting(qr: QrCode) {
    setViewingQr(qr);
    setCreatedQr(null);
    setSelectedCapability(qr.capability as QrCapabilityId);
    setStep("result");
  }

  function handleCreate() {
    if (!businessId || !selectedCapability || !label.trim()) return;

    const config =
      selectedCapability === "menu"
        ? { tableLabel: tableLabel.trim() || undefined }
        : selectedCapability === "web"
          ? { useCustomDomain: webTargetId === "custom" }
          : undefined;

    createQr.mutate({
      businessId,
      capability: selectedCapability,
      label: label.trim(),
      config,
    });
  }

  async function copyLink() {
    if (!activeUrl) return;
    await navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function renderBackButton(onClick: () => void) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
      >
        <ArrowLeft size={16} aria-hidden />
        Back
      </button>
    );
  }

  function renderListStep() {
    return (
      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Your QR codes" />
          {!businessId ? (
            <ListCard>
              <ListCardRow
                dot="#a3a3a3"
                label="Create a business to generate QR codes"
              />
            </ListCard>
          ) : listLoading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : existingQrs.length === 0 ? (
            <ListCard>
              <ListCardRow
                dot="#a3a3a3"
                label="No QR codes yet"
                trailing="Create one below"
              />
            </ListCard>
          ) : (
            <ListCard>
              {existingQrs.map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between gap-3 border-b border-[#ebebeb] px-5 py-4 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => openExisting(qr)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CAPABILITY_DOT[qr.capability as QrCapabilityId] ??
                          "#a3a3a3",
                      }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-neutral-900">
                        {qr.label}
                      </span>
                      <span className="block truncate text-xs text-neutral-400">
                        {capabilityLabel(qr.capability)}
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-neutral-400 hover:text-red-600"
                    disabled={removeQr.isPending}
                    onClick={() =>
                      removeQr.mutate({ id: qr.id, businessId })
                    }
                    aria-label={`Delete ${qr.label}`}
                  >
                    <Trash size={16} aria-hidden />
                  </Button>
                </div>
              ))}
            </ListCard>
          )}
        </section>

        {businessId && capabilities.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Create new" />
            <div className="flex flex-col gap-2">
              {hasMenu && capabilities.some((cap) => cap.id === "menu") ? (
                <Button
                  type="button"
                  className="h-10 w-full justify-center rounded-lg text-white"
                  style={{ backgroundColor: MENU_ACCENT }}
                  onClick={() => startCreate("menu")}
                >
                  <Plus size={16} aria-hidden />
                  Table menu QR
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full justify-center rounded-lg border-[#ebebeb]"
                onClick={() => setStep("capability")}
              >
                <Plus size={16} aria-hidden />
                {hasMenu ? "Other QR types" : "Create QR code"}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  function renderCapabilityStep() {
    return (
      <div className="mt-8 flex flex-col gap-6">
        {renderBackButton(goToList)}
        <section className="flex flex-col gap-3">
          <SectionHeader title="What should this QR do?" />
          <p className="text-sm text-neutral-500">
            Options are based on your account capabilities.
          </p>
          <ListCard>
            {capabilities.map((cap) => (
              <button
                key={cap.id}
                type="button"
                onClick={() => selectCapability(cap.id)}
                className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50"
              >
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CAPABILITY_DOT[cap.id] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-neutral-900">
                    {cap.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {cap.description}
                  </span>
                </span>
              </button>
            ))}
          </ListCard>
        </section>
      </div>
    );
  }

  function renderConfigureStep() {
    if (!selectedCapability) return null;

    const config = QR_CAPABILITY_CONFIG[selectedCapability];

    return (
      <div className="mt-8 flex flex-col gap-6">
        {renderBackButton(() => {
          if (hasMenu && selectedCapability === "menu") {
            goToList();
          } else {
            setStep("capability");
          }
        })}
        <section className="flex flex-col gap-3">
          <SectionHeader title={`Configure ${config.label}`} />
          <p className="text-sm text-neutral-500">{config.description}</p>

          {selectedCapability === "menu" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="table-label">Table or area label</Label>
                <Input
                  id="table-label"
                  value={tableLabel}
                  onChange={(event) => setTableLabel(event.target.value)}
                  placeholder="Table 4, Patio, Bar"
                  className="h-10 rounded-lg"
                />
                <p className="text-xs text-neutral-400">
                  Optional. Guests see this when they scan so orders route to the
                  right table.
                </p>
              </div>

              {menu ? (
                <div className="overflow-hidden rounded-xl border border-[#ebebeb] bg-white">
                  <div
                    className="border-b border-[#ebebeb] px-5 py-4"
                    style={{ borderLeftWidth: 3, borderLeftColor: MENU_ACCENT }}
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {menu.name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {menu.items.length} item
                      {menu.items.length === 1 ? "" : "s"} · /menu/{menu.slug}
                    </p>
                  </div>
                  <div className="divide-y divide-[#ebebeb]">
                    {menuPreviewItems.length > 0 ? (
                      menuPreviewItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-neutral-900">
                              {item.name}
                            </p>
                            {item.description ? (
                              <p className="truncate text-xs text-neutral-400">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-sm text-neutral-500">
                            {formatPrice(item.priceCents)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-4 text-sm text-neutral-500">
                        Menu items will appear here once added.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Loading menu preview…</p>
              )}
            </div>
          ) : null}

          {selectedCapability === "web" ? (
            <div className="flex flex-col gap-3">
              <Label>Destination</Label>
              {webTargets.length > 0 ? (
                <RadioGroup
                  value={webTargetId}
                  onValueChange={(value) =>
                    setWebTargetId(value as "lume" | "custom")
                  }
                  className="overflow-hidden rounded-xl border border-[#ebebeb] bg-white"
                >
                  {webTargets.map((target) => (
                    <label
                      key={target.id}
                      htmlFor={`web-target-${target.id}`}
                      className="flex cursor-pointer items-start gap-3 border-b border-[#ebebeb] px-5 py-4 last:border-b-0 has-[button[data-state=checked]]:bg-neutral-50"
                    >
                      <RadioGroupItem
                        id={`web-target-${target.id}`}
                        value={target.id}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-neutral-900">
                          {target.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {target.url}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-neutral-500">
                  Loading web destinations…
                </p>
              )}
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-2 h-10 rounded-lg"
            style={
              selectedCapability === "menu"
                ? { backgroundColor: MENU_ACCENT, color: "white" }
                : undefined
            }
            onClick={() => setStep("label")}
          >
            Continue
          </Button>
        </section>
      </div>
    );
  }

  function renderLabelStep() {
    if (!selectedCapability) return null;

    return (
      <div className="mt-8 flex flex-col gap-6">
        {renderBackButton(() => {
          if (selectedCapability === "menu" || selectedCapability === "web") {
            setStep("configure");
          } else {
            setStep("capability");
          }
        })}
        <section className="flex flex-col gap-4">
          <SectionHeader title="Name this QR code" />
          <p className="text-sm text-neutral-500">
            A label helps you tell codes apart — e.g. table numbers or placement
            locations.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qr-label">Label</Label>
            <Input
              id="qr-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={defaultLabel(selectedCapability, tableLabel)}
              className="h-10 rounded-lg"
              autoFocus
            />
          </div>
          {createQr.error ? (
            <p className="text-sm text-red-600">{createQr.error.message}</p>
          ) : null}
          <Button
            type="button"
            className="h-10 rounded-lg"
            style={
              selectedCapability === "menu"
                ? { backgroundColor: MENU_ACCENT, color: "white" }
                : undefined
            }
            disabled={!label.trim() || createQr.isPending}
            onClick={handleCreate}
          >
            {createQr.isPending ? "Generating…" : "Generate QR code"}
          </Button>
        </section>
      </div>
    );
  }

  function renderResultStep() {
    if (!activeQr) return null;

    const capability = activeQr.capability as QrCapabilityId;
    const isMenu = capability === "menu";

    return (
      <div className="mt-8 flex flex-col gap-6">
        {renderBackButton(goToList)}
        <section className="flex flex-col items-center gap-6">
          <div className="text-center">
            <SectionHeader title={activeQr.label} className="text-center" />
            <p className="mt-1 text-sm text-neutral-500">
              {capabilityLabel(activeQr.capability)}
            </p>
          </div>

          <div
            className="rounded-2xl border border-[#ebebeb] bg-white p-6 shadow-sm"
            style={isMenu ? { borderTopWidth: 3, borderTopColor: MENU_ACCENT } : undefined}
          >
            <QRCodeSVG
              value={activeUrl}
              size={220}
              level="M"
              includeMargin
              className="mx-auto"
            />
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-[#ebebeb] bg-white px-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm text-neutral-600">
                {activeUrl}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 rounded-lg border-[#ebebeb] px-3"
                onClick={copyLink}
              >
                {copied ? (
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
            </div>
          </div>

          {createdQr ? (
            <p className="text-center text-sm text-neutral-500">
              QR code saved. Print or display it where guests can scan.
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title="QR Code"
        meta="Generate and share QR codes for menus, your site, checkout, and more"
      />

      {step === "list" ? renderListStep() : null}
      {step === "capability" ? renderCapabilityStep() : null}
      {step === "configure" ? renderConfigureStep() : null}
      {step === "label" ? renderLabelStep() : null}
      {step === "result" ? renderResultStep() : null}
    </PageContent>
  );
}

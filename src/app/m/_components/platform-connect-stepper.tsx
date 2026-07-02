"use client";

import { useState } from "react";
import { Check, CheckCircle } from "@phosphor-icons/react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  CONNECT_STEPS,
  PLATFORM_LOCATIONS,
  type ConnectPlatform,
  type ConnectPlatformId,
} from "@/app/m/_lib/connect-platforms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function PlatformConnectStepper({
  platform,
  connected,
  onConnected,
}: {
  platform: ConnectPlatform;
  connected: boolean;
  onConnected: () => void;
}) {
  const { activeBusiness } = useBusinesses();
  const utils = api.useUtils();
  const connectMutation = api.integration.connect.useMutation({
    onSuccess: async () => {
      await utils.integration.invalidate();
    },
  });
  const [step, setStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const locations = PLATFORM_LOCATIONS[platform.id];
  const done = connected || finished;

  function handleAuthorize() {
    setStep(2);
  }

  async function handleConnect() {
    if (!activeBusiness?.id || !selectedLocation) return;

    await connectMutation.mutateAsync({
      businessId: activeBusiness.id,
      platform: platform.id,
      externalLocationId: selectedLocation,
      externalLocationName: selectedLocation,
    });

    setFinished(true);
    onConnected();
  }

  if (!activeBusiness) {
    return (
      <div className="rounded-xl border border-[#ebebeb] bg-white px-5 py-8 text-center">
        <p className="text-sm text-neutral-500">
          Create a restaurant first, then connect delivery platforms.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[#ebebeb] bg-white px-5 py-8 text-center">
        <div
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
        >
          <CheckCircle size={28} weight="fill" aria-hidden />
        </div>
        <h3 className="text-base font-semibold text-neutral-950">
          {platform.label} connected
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Orders from {selectedLocation ?? "your location"} will now flow into Lume.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-2">
        {CONNECT_STEPS.map(({ id, label }, index) => {
          const complete = step > id;
          const active = step === id;

          return (
            <li key={id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    complete && "bg-neutral-900 text-white",
                    active && !complete && "text-white",
                    !active && !complete && "bg-[#f5f5f5] text-neutral-500",
                  )}
                  style={
                    active && !complete
                      ? { backgroundColor: platform.color }
                      : undefined
                  }
                >
                  {complete ? <Check size={14} weight="bold" aria-hidden /> : id}
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
              {index < CONNECT_STEPS.length - 1 ? (
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
                Sign in to {platform.label}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {platform.description} You&apos;ll be redirected to {platform.label} to
                authorize access.
              </p>
            </div>
            <Button
              type="button"
              className="h-10 w-full rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: platform.color }}
              onClick={handleAuthorize}
            >
              Sign in with {platform.label}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Choose your location
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Pick the {platform.label} business you want to connect to Lume.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {locations.map((location) => {
                const selected = selectedLocation === location;

                return (
                  <button
                    key={location}
                    type="button"
                    className={cn(
                      "flex min-h-11 items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-neutral-900 bg-[#fafafa] font-medium text-neutral-900"
                        : "border-[#ebebeb] text-neutral-700 hover:bg-[#fafafa]",
                    )}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <span>{location}</span>
                    {selected ? (
                      <Check size={16} weight="bold" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Confirm connection
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Review what Lume will sync from {platform.label}.
              </p>
            </div>
            <div className="divide-y divide-[#ebebeb] rounded-lg border border-[#ebebeb]">
              {[
                ["Platform", platform.label],
                ["Location", selectedLocation ?? "—"],
                ["Orders", "Incoming orders + status updates"],
                ["Menu", "Items, modifiers, and availability"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-medium text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="h-10 w-full rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: platform.color }}
              onClick={handleConnect}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending
                ? "Connecting..."
                : `Connect ${platform.label}`}
            </Button>
          </div>
        ) : null}
      </div>

      {step > 1 && step < 3 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => setStep((current) => current - 1)}
          >
            Back
          </Button>
          <Button
            type="button"
            className="rounded-lg"
            disabled={step === 2 && !selectedLocation}
            onClick={() => setStep((current) => current + 1)}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <p className="text-center text-xs text-neutral-400">
          Secure OAuth connection · read-only until you confirm
        </p>
      ) : null}
    </div>
  );
}

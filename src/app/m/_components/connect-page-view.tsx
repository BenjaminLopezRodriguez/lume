"use client";

import { useMemo } from "react";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { PlatformConnectStepper } from "@/app/m/_components/platform-connect-stepper";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  CONNECT_PLATFORMS,
  type ConnectPlatformId,
} from "@/app/m/_lib/connect-platforms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";

export function ConnectPageView() {
  const { activeBusiness } = useBusinesses();
  const utils = api.useUtils();

  const { data: integrations = [] } = api.integration.list.useQuery(
    { businessId: activeBusiness?.id ?? "" },
    { enabled: !!activeBusiness?.id },
  );

  const connected = useMemo(
    () =>
      integrations
        .filter((integration) => integration.status === "connected")
        .map((integration) => integration.platform as ConnectPlatformId),
    [integrations],
  );

  const connectedCount = connected.length;

  return (
    <PageContent>
      <PageHeader
        title="Connect"
        meta={
          <>
            <span className="text-neutral-700">
              {connectedCount} of {CONNECT_PLATFORMS.length} connected
            </span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">
              Bring Uber Eats, DoorDash, and Grubhub into one dashboard
            </span>
          </>
        }
      />

      <div className="mt-8">
        <Tabs defaultValue="ubereats" className="gap-6">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-0 border-b border-[#ebebeb] bg-transparent p-0"
          >
            {CONNECT_PLATFORMS.map((platform) => {
              const isConnected = connected.includes(platform.id);

              return (
                <TabsTrigger
                  key={platform.id}
                  value={platform.id}
                  className="rounded-none px-4 py-3 text-sm text-neutral-500 after:bottom-0 after:h-0.5 data-active:text-neutral-950"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: platform.color }}
                    aria-hidden
                  />
                  {platform.label}
                  {isConnected ? (
                    <span className="rounded-full bg-[#e2f1af] px-2 py-0.5 text-[0.625rem] font-medium text-neutral-700">
                      Live
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CONNECT_PLATFORMS.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="mt-0">
              <PlatformConnectStepper
                platform={platform}
                connected={connected.includes(platform.id)}
                onConnected={async () => {
                  await utils.integration.invalidate();
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageContent>
  );
}

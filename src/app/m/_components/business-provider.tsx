"use client";

import { createContext, useContext, useMemo } from "react";
import { api, type RouterOutputs } from "@/trpc/react";

type Business = RouterOutputs["business"]["list"][number];

type BusinessContextValue = {
  businesses: Business[];
  activeBusiness: Business | null | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
  setActiveBusiness: (id: string) => Promise<void>;
  getBusinessByType: (type: Business["type"]) => Business | null;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const utils = api.useUtils();
  const { data: businesses = [], isLoading } = api.business.list.useQuery();
  const { data: activeBusiness } = api.business.getActive.useQuery();
  const setActiveMutation = api.business.setActive.useMutation({
    onSuccess: async () => {
      await utils.business.invalidate();
    },
  });

  const value = useMemo(() => {
    function getBusinessByType(type: Business["type"]) {
      if (activeBusiness?.type === type) return activeBusiness;
      return businesses.find((business) => business.type === type) ?? null;
    }

    return {
      businesses,
      activeBusiness,
      isLoading,
      refetch: async () => {
        await utils.business.invalidate();
      },
      setActiveBusiness: async (id: string) => {
        await setActiveMutation.mutateAsync({ id });
      },
      getBusinessByType,
    };
  }, [businesses, activeBusiness, isLoading, utils.business, setActiveMutation]);

  return (
    <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
  );
}

export function useBusinesses() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinesses must be used within BusinessProvider");
  }
  return context;
}

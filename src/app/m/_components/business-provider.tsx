"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Business,
  BusinessType,
  CreateEventInput,
  CreateRestaurantInput,
  CreateStoreInput,
} from "@/app/m/_lib/business-types";
import {
  ACTIVE_STORAGE_KEY,
  STORAGE_KEY,
} from "@/app/m/_lib/business-types";

type BusinessContextValue = {
  businesses: Business[];
  activeBusiness: Business | null;
  createStore: (input: CreateStoreInput) => Business;
  createRestaurant: (input: CreateRestaurantInput) => Business;
  createEvent: (input: CreateEventInput) => Business;
  setActiveBusiness: (id: string) => void;
  getLatestByType: <T extends BusinessType>(
    type: T,
  ) => Extract<Business, { type: T }> | null;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

function loadBusinesses(): Business[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Business[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_STORAGE_KEY);
}

function persistBusinesses(businesses: Business[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
}

function persistActiveId(id: string) {
  window.localStorage.setItem(ACTIVE_STORAGE_KEY, id);
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setBusinesses(loadBusinesses());
    setActiveId(loadActiveId());
  }, []);

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeId) ?? null,
    [businesses, activeId],
  );

  const setActiveBusiness = useCallback((id: string) => {
    setActiveId(id);
    persistActiveId(id);
  }, []);

  const addBusiness = useCallback(
    (business: Business) => {
      setBusinesses((current) => {
        const next = [business, ...current];
        persistBusinesses(next);
        return next;
      });
      setActiveBusiness(business.id);
      return business;
    },
    [setActiveBusiness],
  );

  const createStore = useCallback(
    (input: CreateStoreInput) =>
      addBusiness({
        id: crypto.randomUUID(),
        type: "store",
        createdAt: new Date().toISOString(),
        ...input,
      }),
    [addBusiness],
  );

  const createRestaurant = useCallback(
    (input: CreateRestaurantInput) =>
      addBusiness({
        id: crypto.randomUUID(),
        type: "restaurant",
        createdAt: new Date().toISOString(),
        ...input,
      }),
    [addBusiness],
  );

  const createEvent = useCallback(
    (input: CreateEventInput) =>
      addBusiness({
        id: crypto.randomUUID(),
        type: "event",
        createdAt: new Date().toISOString(),
        ...input,
      }),
    [addBusiness],
  );

  const getLatestByType = useCallback(
    <T extends BusinessType>(type: T) => {
      const match = businesses.find((business) => business.type === type);
      return (match ?? null) as Extract<Business, { type: T }> | null;
    },
    [businesses],
  );

  const value = useMemo(
    () => ({
      businesses,
      activeBusiness,
      createStore,
      createRestaurant,
      createEvent,
      setActiveBusiness,
      getLatestByType,
    }),
    [
      businesses,
      activeBusiness,
      createStore,
      createRestaurant,
      createEvent,
      setActiveBusiness,
      getLatestByType,
    ],
  );

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

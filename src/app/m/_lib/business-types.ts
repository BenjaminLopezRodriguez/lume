export type BusinessType = "store" | "restaurant" | "event";

export type StoreBusiness = {
  id: string;
  type: "store";
  name: string;
  description: string;
  createdAt: string;
};

export type RestaurantBusiness = {
  id: string;
  type: "restaurant";
  name: string;
  cuisine: string;
  address: string;
  createdAt: string;
};

export type EventBusiness = {
  id: string;
  type: "event";
  name: string;
  date: string;
  location: string;
  capacity: string;
  createdAt: string;
};

export type Business = StoreBusiness | RestaurantBusiness | EventBusiness;

export type CreateStoreInput = Omit<StoreBusiness, "id" | "type" | "createdAt">;
export type CreateRestaurantInput = Omit<RestaurantBusiness, "id" | "type" | "createdAt">;
export type CreateEventInput = Omit<EventBusiness, "id" | "type" | "createdAt">;

export const BUSINESS_ROUTES: Record<BusinessType, string> = {
  store: "/m/store",
  restaurant: "/m/restaurant",
  event: "/m/event",
};

export const STORAGE_KEY = "lume-businesses";
export const ACTIVE_STORAGE_KEY = "lume-active-business";

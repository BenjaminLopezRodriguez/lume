export type {
  BusinessType,
  PrimaryPrimitive,
  ShareMode,
  ShareModeConfig,
  VerticalConfig,
} from "@/verticals/types";

export {
  BUSINESS_ROUTES,
  SHARE_MODE_CONFIG,
  VERTICAL_CONFIG,
  getShareModesForVertical,
  getVerticalConfig,
} from "@/verticals/types";

// Legacy client-side business shapes (localStorage era)
export type StoreBusiness = {
  id: string;
  type: "store";
  name: string;
  description: string;
  createdAt: string;
};

export type ServicesBusiness = {
  id: string;
  type: "services";
  name: string;
  trade: string;
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

export type Business =
  | StoreBusiness
  | ServicesBusiness
  | RestaurantBusiness
  | EventBusiness;

export const STORAGE_KEY = "lume-businesses";
export const ACTIVE_STORAGE_KEY = "lume-active-business";

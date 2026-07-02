export type AssetType =
  | "product"
  | "dining_relationship"
  | "completed_work"
  | "attendance";

export type OwnershipStatus =
  | "active"
  | "pending_action"
  | "transferred"
  | "completed";

export type OwnershipSource =
  | "stripe_checkout"
  | "manual"
  | "pos"
  | "invoice"
  | "import";

export type CreateOwnershipInput = {
  businessId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  assetType: AssetType;
  assetId?: string | null;
  source: OwnershipSource;
  sourceRef?: string | null;
  purchasedAt?: Date;
};

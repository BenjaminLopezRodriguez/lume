export type ConnectPlatformId = "ubereats" | "doordash" | "grubhub";

export type ConnectPlatform = {
  id: ConnectPlatformId;
  label: string;
  color: string;
  description: string;
};

export const CONNECT_PLATFORMS: ConnectPlatform[] = [
  {
    id: "ubereats",
    label: "Uber Eats",
    color: "#06c167",
    description: "Pull Uber Eats orders into your Lume dashboard.",
  },
  {
    id: "doordash",
    label: "DoorDash",
    color: "#ff3008",
    description: "Sync DoorDash menus, orders, and status in one place.",
  },
  {
    id: "grubhub",
    label: "Grubhub",
    color: "#f63440",
    description: "Connect Grubhub so every delivery order lands in Lume.",
  },
];

export const CONNECT_STEPS = [
  { id: 1, label: "Authorize" },
  { id: 2, label: "Select location" },
  { id: 3, label: "Confirm" },
] as const;

export const PLATFORM_LOCATIONS: Record<ConnectPlatformId, string[]> = {
  ubereats: ["Rosemary Bistro · Downtown", "Rosemary Bistro · South Lamar"],
  doordash: ["Rosemary Bistro", "Rosemary Bistro - Catering"],
  grubhub: ["Rosemary Bistro Main", "Rosemary Patio"],
};

export const CONNECT_STORAGE_KEY = "lume-connected-platforms";

export function loadConnectedPlatforms(): ConnectPlatformId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CONNECT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConnectPlatformId[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConnectedPlatform(id: ConnectPlatformId) {
  const current = loadConnectedPlatforms();
  if (current.includes(id)) return;
  window.localStorage.setItem(
    CONNECT_STORAGE_KEY,
    JSON.stringify([...current, id]),
  );
}

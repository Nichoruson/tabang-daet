import type { EmergencyCategory } from "./types";

export const DAET_CENTER = { lat: 14.1122, lng: 122.9556 } as const;

export const CATEGORY_META: Record<
  EmergencyCategory,
  { label: string; icon: string; color: string; ring: string }
> = {
  fire: {
    label: "Fire",
    icon: "🔥",
    color: "bg-orange-600 hover:bg-orange-500",
    ring: "ring-orange-400",
  },
  medical: {
    label: "Medical",
    icon: "🚑",
    color: "bg-red-600 hover:bg-red-500",
    ring: "ring-red-400",
  },
  police: {
    label: "Police",
    icon: "🚔",
    color: "bg-blue-700 hover:bg-blue-600",
    ring: "ring-blue-400",
  },
  accident: {
    label: "Accident",
    icon: "🚧",
    color: "bg-amber-600 hover:bg-amber-500",
    ring: "ring-amber-400",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending validation",
  validated: "Validated",
  dispatched: "Unit dispatched",
  on_scene: "On scene",
  resolved: "Resolved",
};

export const DISPATCHER_CREDENTIALS = {
  username: "mdrrmo",
  password: "tabang2026",
};

export const RESPONDER_CREDENTIALS = {
  username: "responder",
  password: "field2026",
};

export const DEMO_OTP = "123456";

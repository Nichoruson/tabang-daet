import type { EmergencyCategory } from "./types";

export const DAET_CENTER = { lat: 14.1122, lng: 122.9556 } as const;

export const CATEGORY_META: Record<
  EmergencyCategory,
  { label: string; icon: string; color: string; ring: string }
> = {
  fire: {
    label: "Fire",
    icon: "fire",
    color: "bg-orange-600/20 text-orange-400 border-orange-500/30 hover:bg-orange-600/30",
    ring: "ring-orange-500/50",
  },
  medical: {
    label: "Medical",
    icon: "medical",
    color: "bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30",
    ring: "ring-red-500/50",
  },
  police: {
    label: "Police",
    icon: "police",
    color: "bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30",
    ring: "ring-blue-500/50",
  },
  accident: {
    label: "Accident",
    icon: "accident",
    color: "bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30",
    ring: "ring-amber-500/50",
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

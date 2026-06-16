"use client";

import { Flame, Activity, Shield, AlertTriangle } from "lucide-react";
import type { EmergencyCategory } from "@/lib/types";

type CategoryIconProps = {
  category: EmergencyCategory | string;
  className?: string;
  size?: number;
};

export function CategoryIcon({ category, className = "", size = 20 }: CategoryIconProps) {
  switch (category) {
    case "fire":
      return <Flame className={`text-orange-500 ${className}`} size={size} />;
    case "medical":
      return <Activity className={`text-red-500 ${className}`} size={size} />;
    case "police":
      return <Shield className={`text-blue-500 ${className}`} size={size} />;
    case "accident":
      return <AlertTriangle className={`text-amber-500 ${className}`} size={size} />;
    default:
      return <AlertTriangle className={`text-slate-500 ${className}`} size={size} />;
  }
}

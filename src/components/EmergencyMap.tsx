"use client";

import { DAET_CENTER } from "@/lib/constants";
import type { IncidentReport } from "@/lib/types";
import L from "leaflet";
import { useEffect, useRef } from "react";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type EmergencyMapProps = {
  incidents?: IncidentReport[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  draggablePin?: boolean;
  onPinMove?: (lat: number, lng: number) => void;
  className?: string;
};

function severityColor(severity: string): string {
  if (severity === "critical") return "#dc2626";
  if (severity === "high") return "#ea580c";
  if (severity === "moderate") return "#d97706";
  return "#64748b";
}

export function EmergencyMap({
  incidents = [],
  center,
  zoom = 14,
  height = "320px",
  selectedId,
  onSelect,
  draggablePin = false,
  onPinMove,
  className = "",
}: EmergencyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);

  const mapCenter = center ?? DAET_CENTER;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (draggablePin) {
      pinRef.current = L.marker([mapCenter.lat, mapCenter.lng], {
        draggable: true,
        icon: defaultIcon,
      }).addTo(map);

      pinRef.current.on("dragend", () => {
        const pos = pinRef.current?.getLatLng();
        if (pos && onPinMove) {
          onPinMove(pos.lat, pos.lng);
        }
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) {
      return;
    }

    group.clearLayers();

    incidents.forEach((incident) => {
      const isSelected = incident.id === selectedId;
      const marker = L.circleMarker([incident.latitude, incident.longitude], {
        radius: isSelected ? 12 : 8,
        color: isSelected ? "#fff" : severityColor(incident.severity),
        fillColor: severityColor(incident.severity),
        fillOpacity: 0.85,
        weight: isSelected ? 3 : 2,
      });

      marker.bindPopup(
        `<strong>${incident.id}</strong><br/>${incident.category.toUpperCase()} — ${incident.status}`,
      );

      if (onSelect) {
        marker.on("click", () => onSelect(incident.id));
      }

      marker.addTo(group);
    });
  }, [incidents, selectedId, onSelect]);

  useEffect(() => {
    if (pinRef.current && center) {
      pinRef.current.setLatLng([center.lat, center.lng]);
      mapRef.current?.panTo([center.lat, center.lng]);
    }
  }, [center?.lat, center?.lng]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-xl border border-[#3d4f6f] ${className}`}
      style={{ height, width: "100%" }}
    />
  );
}

"use client";

import dynamic from "next/dynamic";

// Leaflet requires browser APIs (window, document) — disable SSR
const MapClient = dynamic(() => import("./MapClient"), { ssr: false });

export default function MapPage() {
  return <MapClient />;
}

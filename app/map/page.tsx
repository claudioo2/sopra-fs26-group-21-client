"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.error("token is missing");
      return;
    }

    if (!mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [13.4050, 52.52], // [longitude, latitude]
      zoom: 12,
    });

    mapInstanceRef.current = map;

    //center location
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );

    // marker
    const markerEl = document.createElement("div");
    markerEl.style.width = "32px";
    markerEl.style.height = "32px";
    markerEl.style.borderRadius = "9999px";
    markerEl.style.backgroundColor = "#1d4ed8";
    markerEl.style.border = "2px solid #0f172a";
    markerEl.style.color = "#000000";
    markerEl.style.display = "flex";
    markerEl.style.alignItems = "center";
    markerEl.style.justifyContent = "center";
    markerEl.style.fontWeight = "700";
    markerEl.style.fontSize = "14px";
    markerEl.style.cursor = "pointer";
    markerEl.textContent = "E";

    new mapboxgl.Marker(markerEl)
      .setLngLat([13.4019, 52.5169])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          "<h3 style='color: #0f172a'>Sample event</h3><p style='color: #0b0b0b'> event marker</p>"
        )
      )
      .addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <main>
      <h1>Map</h1>
      <div ref={mapRef} style={{ width: "100%", height: "500px" }} />
    </main>
  );
}
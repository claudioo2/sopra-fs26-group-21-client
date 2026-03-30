"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useApi } from "@/hooks/useApi";
import { EventDTO } from "@/types/event";

const DEFAULT_CENTER: [number, number] = [13.405, 52.52]; // Berlin fallback

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const apiService = useApi();

  useEffect(() => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.error("Mapbox token is missing");
      return;
    }

    if (!mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    const token = localStorage.getItem("token") ?? "";

    const createEventMarker = (event: EventDTO, map: mapboxgl.Map) => {
      const markerEl = document.createElement("div");
      markerEl.style.cursor = "pointer";
      markerEl.style.width = "32px";
      markerEl.style.height = "42px";
      markerEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="32" height="42">
          <path d="M12 0C7.589 0 4 3.589 4 8c0 5.698 7.199 13.518 7.502 13.855a.665.665 0 0 0 .996 0C12.801 21.518 20 13.698 20 8c0-4.411-3.589-8-8-8z" fill="#c0392b"/>
          <circle cx="12" cy="8" r="3.5" fill="white"/>
        </svg>
      `;

      new mapboxgl.Marker(markerEl)
        .setLngLat([event.longitude, event.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3 style="color:#0f172a;margin:0 0 4px 0">${event.title}</h3>
            <p style="color:#374151;margin:0 0 4px 0">${event.description ?? ""}</p>
            <p style="color:#6b7280;margin:0;font-size:12px">
              Starts: ${new Date(event.startTime).toLocaleString()}
            </p>
          `)
        )
        .addTo(map);
    };

    const fetchAndDisplayEvents = async (map: mapboxgl.Map, center: [number, number]) => {
      try {
        const [lng, lat] = center;
        const events = await apiService.get<EventDTO[]>(
          `/events?longitude=${lng}&latitude=${lat}&radius=20`,
          { Authorization: token }
        );
        events.forEach((event) => {
          if (!event.isPrivate) {
            createEventMarker(event, map);
          }
        });
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    const initMap = (center: [number, number]) => {
      if (!mapRef.current) return;

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 12,
      });

      mapInstanceRef.current = map;

      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        })
      );

      map.on("load", () => {
        fetchAndDisplayEvents(map, center);
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          initMap([position.coords.longitude, position.coords.latitude]);
        },
        () => {
          initMap(DEFAULT_CENTER);
        }
      );
    } else {
      initMap(DEFAULT_CENTER);
    }

    return () => {
      mapInstanceRef.current?.remove();
    };
  }, [apiService]);

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1>Map</h1>
      <div ref={mapRef} style={{ flex: 1, width: "100%" }} />
    </main>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import { App, Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented, Modal, Select, Rate } from "antd";
import { LockOutlined, GlobalOutlined, PlusOutlined, CompassOutlined, UserOutlined, KeyOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventCategory, EventDTO } from "@/types/event";
import { getApiDomain } from "@/utils/domain";
import { User } from "@/types/user";
import "@/styles/globals.css";

const CATEGORY_COLORS: Record<EventCategory, string> = {
  SPORTS:  "#f97316",
  MUSIC:   "#a855f7",
  FOOD:    "#f43f5e",
  ART:     "#ec4899",
  SOCIAL:  "#3b82f6",
  OUTDOOR: "#22c55e",
  PARTY:   "#eab308",
  OTHER:   "#94a3b8",
};

const ALL_CATEGORIES: EventCategory[] = ["SPORTS", "MUSIC", "FOOD", "ART", "SOCIAL", "OUTDOOR", "PARTY", "OTHER"];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  SPORTS:  "Sports",
  MUSIC:   "Music",
  FOOD:    "Food",
  ART:     "Art",
  SOCIAL:  "Social",
  OUTDOOR: "Outdoor",
  PARTY:   "Party",
  OTHER:   "Other",
};

// Lucide-style SVG icon paths (viewBox 0 0 24 24, stroke-based)
const CATEGORY_ICONS: Record<EventCategory, string> = {
  SPORTS:  `<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  MUSIC:   `<path d="M9 18V5l12-2v13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="6" cy="18" r="3" stroke="white" stroke-width="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="white" stroke-width="2" fill="none"/>`,
  FOOD:    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M7 2v20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  ART:     `<circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="white" stroke-width="2" fill="none"/>`,
  SOCIAL:  `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="9" cy="7" r="4" stroke="white" stroke-width="2" fill="none"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  OUTDOOR: `<path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  PARTY:   `<path d="M5.8 11.3 2 22l10.7-3.79" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M4 3h.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M22 8h.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M15 2h.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M22 20h.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z" stroke="white" stroke-width="2" fill="none"/>`,
  OTHER:   `<circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><path d="M12 8v4" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 16h.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
};

interface EventFormValues {
  title: string;
  startDate: Dayjs;
  startTime: Dayjs;
  endDate: Dayjs;
  endTime: Dayjs;
  description: string;
  privacy: "public" | "private";
  category: EventCategory;
}

interface EventJoinFormValues {
  inviteCode: string;
}

interface Message {
  id: number;
  content: string;
  senderUsername: string;
  timestamp: string;
  eventId: number;
}

const DEFAULT_CENTER: [number, number] = [8.5404, 47.378]; // Zurich fallback

const CLUSTER_RADIUS = 50;       // px — supercluster grouping radius
const CLUSTER_MAX_ZOOM = 16;     // beyond this zoom we stop clustering
const SPIDER_LEAF_RADIUS = 64;   // px — distance from cluster centre to each spider leaf
const SPIDER_LEAF_RADIUS_PER_LEAF = 3; // grow the circle a bit when many leaves

type EventFeatureProps = { event: EventDTO };

function getParticipantIds(event: EventDTO): number[] {
  const eventWithOldIds = event as EventDTO & {
    participantIds?: number[];
  };

  if (event.participants?.length) {
    return event.participants.map((u) => Number(u.id));
  }

  if (eventWithOldIds.participantIds?.length) {
    return eventWithOldIds.participantIds.map((id) => Number(id));
  }

  return [];
}

function buildPinSvg(category: EventCategory | null | undefined): string {
  const color = category ? CATEGORY_COLORS[category] : "#94a3b8";
  const icon = category ? CATEGORY_ICONS[category] : CATEGORY_ICONS.OTHER;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 62" width="48" height="62" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <circle cx="24" cy="24" r="22" fill="${color}"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
      <polygon points="24,58 16,40 32,40" fill="${color}"/>
      <g transform="translate(12, 12)">
        <svg viewBox="0 0 24 24" width="24" height="24">${icon}</svg>
      </g>
    </svg>
  `;
}

function buildPinElement(event: EventDTO): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative; width:48px; height:62px; cursor:pointer;";
  const isOngoing = (() => {
    const now = new Date();
    return new Date(event.startTime) <= now && now <= new Date(event.endTime);
  })();
  if (isOngoing) {
    const pulse = document.createElement("div");
    pulse.className = "marker-pulse-ring";
    pulse.style.backgroundColor = event.category ? CATEGORY_COLORS[event.category] : "#94a3b8";
    pulse.style.opacity = "0.4";
    wrapper.appendChild(pulse);
  }
  wrapper.insertAdjacentHTML("beforeend", buildPinSvg(event.category));
  return wrapper;
}

function buildClusterDonutSvg(
  counts: Partial<Record<EventCategory, number>>,
  total: number,
  size: number,
): string {
  const radius = size / 2;
  const innerRadius = radius * 0.55;
  const presentCats = ALL_CATEGORIES.filter((c) => (counts[c] ?? 0) > 0);

  const fontSize = innerRadius * 0.95;
  const center = `<circle cx="${radius}" cy="${radius}" r="${innerRadius * 0.95}" fill="white"/>
      <text x="${radius}" y="${radius}" text-anchor="middle" dominant-baseline="central"
            font-family="-apple-system, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="#0f172a">${total}</text>`;

  // Single-category donut: avoid 360° arc edge-case by drawing two concentric circles.
  if (presentCats.length === 1) {
    const cat = presentCats[0];
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"
           style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.4))">
        <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${CATEGORY_COLORS[cat]}" stroke="white" stroke-width="2"/>
        ${center}
      </svg>
    `;
  }

  let angle = -Math.PI / 2;
  const segments: string[] = [];
  for (const cat of presentCats) {
    const count = counts[cat] ?? 0;
    const sweep = (2 * Math.PI * count) / total;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    const x0 = radius + Math.cos(a0) * radius;
    const y0 = radius + Math.sin(a0) * radius;
    const x1 = radius + Math.cos(a1) * radius;
    const y1 = radius + Math.sin(a1) * radius;
    const xi0 = radius + Math.cos(a0) * innerRadius;
    const yi0 = radius + Math.sin(a0) * innerRadius;
    const xi1 = radius + Math.cos(a1) * innerRadius;
    const yi1 = radius + Math.sin(a1) * innerRadius;
    const largeArc = sweep > Math.PI ? 1 : 0;
    const d = [
      `M ${x0} ${y0}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`,
      `L ${xi1} ${yi1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi0} ${yi0}`,
      "Z",
    ].join(" ");
    segments.push(`<path d="${d}" fill="${CATEGORY_COLORS[cat]}" stroke="white" stroke-width="1.5"/>`);
  }
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"
         style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.4))">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
      ${segments.join("\n")}
      ${center}
    </svg>
  `;
}

function buildClusterElement(
  counts: Partial<Record<EventCategory, number>>,
  total: number,
): HTMLDivElement {
  const size = total < 10 ? 48 : total < 100 ? 56 : 64;
  const wrapper = document.createElement("div");
  wrapper.className = "cluster-marker";
  wrapper.style.cssText = `width:${size}px; height:${size}px;`;
  wrapper.innerHTML = buildClusterDonutSvg(counts, total, size);
  return wrapper;
}

export default function MapPage() {
  const router = useRouter();
  const apiService = useApi();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const spiderMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const spiderClusterIdRef = useRef<number | null>(null);
  const superclusterRef = useRef<Supercluster<EventFeatureProps> | null>(null);
  const mapCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const stompClientRef = useRef<Client | null>(null);
  const notifClientRef = useRef<Client | null>(null);
  const chatEventRef = useRef<EventDTO | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(() => {
    if (typeof window === "undefined") return new Set<EventCategory>();
    try {
      const saved = sessionStorage.getItem("filter_activeCategories");
      return saved ? new Set(JSON.parse(saved) as EventCategory[]) : new Set<EventCategory>();
    } catch { return new Set<EventCategory>(); }
  });
  const [myEventsOnly, setMyEventsOnly] = useState(() => {
    if (typeof window === "undefined") return false;
    return JSON.parse(sessionStorage.getItem("filter_myEventsOnly") ?? "false") as boolean;
  });
  const [friendsOnly, setFriendsOnly] = useState(() => {
    if (typeof window === "undefined") return false;
    return JSON.parse(sessionStorage.getItem("filter_friendsOnly") ?? "false") as boolean;
  });
  const [includePast, setIncludePast] = useState(() => {
    if (typeof window === "undefined") return false;
    return JSON.parse(sessionStorage.getItem("filter_includePast") ?? "false") as boolean;
  });
  const includePastRef = useRef(
    typeof window !== "undefined"
      ? (JSON.parse(sessionStorage.getItem("filter_includePast") ?? "false") as boolean)
      : false
  );

  useEffect(() => {
    sessionStorage.setItem("filter_activeCategories", JSON.stringify([...activeCategories]));
  }, [activeCategories]);
  useEffect(() => {
    sessionStorage.setItem("filter_myEventsOnly", JSON.stringify(myEventsOnly));
  }, [myEventsOnly]);
  useEffect(() => {
    sessionStorage.setItem("filter_friendsOnly", JSON.stringify(friendsOnly));
  }, [friendsOnly]);
  useEffect(() => {
    sessionStorage.setItem("filter_includePast", JSON.stringify(includePast));
  }, [includePast]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const [leavingEvent, setLeavingEvent] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [participantUsers, setParticipantUsers] = useState<User[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);

  const [joiningEvent, setJoiningEvent] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [stompConnected, setStompConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [form] = Form.useForm();
  const { message: messageApi, notification: notificationApi } = App.useApp();

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const [isMounted, setIsMounted] = useState(false);

  const eventsByIdRef = useRef<Map<number, EventDTO>>(new Map());
  const pulseAnimationRef = useRef<number | null>(null);
  const ENABLE_CHAT_NOTIFICATIONS = false;

  const [eventsAtLocation, setEventsAtLocation] = useState<EventDTO[]>([]);
  const [locationEventsOpen, setLocationEventsOpen] = useState(false);

  const clearSpider = useCallback(() => {
    spiderMarkersRef.current.forEach((m) => m.remove());
    spiderMarkersRef.current = [];
    spiderClusterIdRef.current = null;
  }, []);

  const renderEventMarkers = async (map: mapboxgl.Map, events: EventDTO[]) => {
    eventsByIdRef.current = new Map(events.map((event) => [event.id, event]));

    await loadCategoryPinIcons(map);

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: events.map((event) => {
        const now = new Date();

        const isOngoing =
          new Date(event.startTime) <= now && now <= new Date(event.endTime);
        
        return {
            type: "Feature",
            geometry: {
              type: "Point", 
              coordinates: [Number(event.longitude), Number(event.latitude)],
            },
          properties: {
            eventId: event.id,
            icon: `pin-${event.category ?? "OTHER"}`,
            color: event.category ? CATEGORY_COLORS[event.category] : "#94a3b8",
            isOngoing,
          },
        };
      }),
    }

    const existingSource = map.getSource("events-source") as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(geojson);
      return;
    }

    map.addSource("events-source", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 18,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "event-clusters-glow",
      type: "circle",
      source: "events-source",
      filter: ["has", "point_count"],
      paint: {
        "circle-radius": [
          "step",
          ["get", "point_count"],
          28,
          10,
          34,
          30,
          42,
          60,
          50,
        ],
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#8b5cf6",
          10,
          "#3b82f6",
          30,
          "#22c55e",
          60,
          "#f97316",
        ],
        "circle-opacity": 0.18,
        "circle-blur": 0.6,
      },
    });

    map.addLayer({
      id: "event-clusters",
      type: "circle",
      source: "events-source",
      filter: ["has", "point_count"],
      paint: {
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,   // 1-9
          10,
          26,   // 10-29
          30,
          32,   // 30-59
          60,
          38,   // 60+
        ],
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#8b5cf6", // small clusters
          10,
          "#3b82f6", // medium
          30,
          "#22c55e", // bigger
          60,
          "#f97316", // large
        ],
        "circle-opacity": 0.92,
        "circle-stroke-width": 3,
        "circle-stroke-color": "#111827",
      },
    });

    map.addLayer({
      id: "event-cluster-count",
      type: "symbol",
      source: "events-source",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 15,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    map.addLayer({
      id: "events-pulse",
      type: "circle",
      source: "events-source",
      filter: ["!", ["has", "point_count"]],
      /*filter: ["==", ["get", "isOngoing"], true], */
      paint: {
        "circle-radius": 24,
        "circle-color": ["get", "color"],
        "circle-opacity": 0.35,
        "circle-translate": [0, -36],
      },
    });

    map.addLayer({
      id: "events-hitbox",
      type: "circle",
      source: "events-source",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": 30,
        "circle-color": "#000000",
        "circle-opacity": 0,
        "circle-translate": [0, -36],
      },
    });

    map.addLayer({
      id: "events-pins",
      type: "symbol",
      source: "events-source",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": 1.8,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });


    if (pulseAnimationRef.current !== null) {
      cancelAnimationFrame(pulseAnimationRef.current);
      pulseAnimationRef.current = null;
    }


    if (pulseAnimationRef.current === null) {
      const animatePulse = () => {
        if (!map.getLayer("events-pulse")) {
          pulseAnimationRef.current = null;
          return;
        }

        const time = Date.now() / 1000;
        const progress = (Math.sin(time * 3) + 1) / 2;

        const radius = 18 + progress * 18;
        const opacity = 0.45 - progress * 0.35;

        map.setPaintProperty("events-pulse", "circle-radius", radius);
        map.setPaintProperty("events-pulse", "circle-opacity", opacity);

        pulseAnimationRef.current = requestAnimationFrame(animatePulse);
      };

      pulseAnimationRef.current = requestAnimationFrame(animatePulse);
    }

    map.on("click", "events-hitbox", (e) => {
      const feature = e.features?.[0];
      const eventId = feature?.properties?.eventId;

      if (eventId == null) return;

      const event = eventsByIdRef.current.get(Number(eventId));

      if (event) {
        setSelectedEvent(event);
      }
    });

    map.on("click", "event-clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["event-clusters"],
      });

      const clusterFeature = features[0];

      if (!clusterFeature) return;

      const clusterId = clusterFeature.properties?.cluster_id;

      if (clusterId == null) return;

      const source = map.getSource("events-source") as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(Number(clusterId), (err, zoom) => {
        if (err || zoom == null) return;

        const coordinates = (clusterFeature.geometry as GeoJSON.Point)
          .coordinates as [number, number];

        const currentZoom = map.getZoom();

        if (zoom <= 14 && zoom > currentZoom) {
          map.easeTo({
            center: coordinates,
            zoom,
            duration: 500,
          });

          return;
        }

        source.getClusterLeaves(Number(clusterId), 100, 0, (leafErr, leaves) => {
          if (leafErr || !leaves) return;

          const events = leaves
            .map((leaf) => {
              const eventId = leaf.properties?.eventId;
              return eventsByIdRef.current.get(Number(eventId));
            })
            .filter(Boolean) as EventDTO[];

          setEventsAtLocation(events);
          setLocationEventsOpen(true);
        });
      });
    });

    map.on("mouseenter", "events-hitbox", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "events-hitbox", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "event-clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "event-clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  };



  const loadCategoryPinIcons = async (map: mapboxgl.Map) => {
    const categories = Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>;

    for (const category of categories) {
      const imageId = `pin-${category}`;

      if (map.hasImage(imageId)) continue;

      const color =
        category in CATEGORY_COLORS
          ? CATEGORY_COLORS[category as EventCategory]
          : "#94a3b8";

      const icon = CATEGORY_ICONS[category];

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="62" viewBox="0 0 48 62">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
          </filter>

          <g filter="url(#shadow)">
            <circle cx="24" cy="24" r="22" fill="${color}"/>
            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
            <polygon points="24,62 15,40 33,40" fill="${color}"/>
          </g>

          <g transform="translate(12, 12)" fill="white" stroke="white">
            <svg viewBox="0 0 24 24" width="24" height="24">
              ${icon}
            </svg>
          </g>
        </svg>
      `;

      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

      if (!map.hasImage(imageId)) {
        map.addImage(imageId, image, { pixelRatio: 2 });
      }
    }
  };

  // Resize the map after any panel opens or closes.
  // useEffect fires after React commits the DOM change, so the map div already
  // has its new dimensions when resize() is called.
  useEffect(() => {
    requestAnimationFrame(() => {
      mapInstanceRef.current?.resize();
    });
  }, [panelOpen, chatOpen]);

  // Auto-scroll to bottom when new chat messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch my rating when an event modal opens
  useEffect(() => {
    if (!selectedEvent || !token) {
      setMyRating(null);
      return;
    }
    const fetchMyRating = async () => {
      try {
        const r = await apiService.get<{ score: number } | null>(
          `/events/${selectedEvent.id}/ratings/me`,
          { Authorization: `Bearer ${token}` }
        );
        setMyRating(r?.score ?? null);
      } catch {
        setMyRating(null);
      }
    };
    fetchMyRating();
  }, [selectedEvent, token, apiService]);

  // Auth guard — delays check by one render to avoid SSR/localStorage issues
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
    if (!token) {
      router.push("/login");
      return;
    }
    const validate = async () => {
      try {
        await apiService.get("/auth/validate", { Authorization: `Bearer ${token}` });
      } catch {
        clearToken();
        router.push("/login");
      }
    };
    validate();
  }, [token, apiService, router, clearToken, isMounted]);

  // fetch the following users
  const fetchFollowing = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiService.get<User[]>(
        "/users/following",
        { Authorization: `Bearer ${token}` }
      );

      setFollowedUsers(data);

    } catch (err) {
      console.error("Failed to fetch following", err);
    }
  }, [token, apiService]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);


  useEffect(() => { fetchFollowing(); }, [fetchFollowing]);

  useEffect(() => {
    if (!userId || !token) return;
    const fetchUser = async () => {
      try {
        const data = await apiService.get<User>(
          `/users/${userId}`,
          { Authorization: `Bearer ${token}` }
        );

        setUser(data);

      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, [userId, token, apiService]);

  // Fetch my rating when an event modal opens
  useEffect(() => {
    if (!selectedEvent || !token) { setMyRating(null); return; }
    const fetchMyRating = async () => {
      try {
        const r = await apiService.get<{ score: number } | null>(
          `/events/${selectedEvent.id}/ratings/me`,
          { Authorization: `Bearer ${token}` }
        );
        setMyRating(r?.score ?? null);
      } catch { setMyRating(null); }
    };
    fetchMyRating();
  }, [selectedEvent, token, apiService]);

  // Fetch participant user objects when a modal opens so we can show follow/unfollow
  useEffect(() => {
    if (!selectedEvent || !token) {
      setParticipantUsers([]);
      return;
    }

    const participantIds = getParticipantIds(selectedEvent);

    console.log("selectedEvent:", selectedEvent);
    console.log("participantIds:", participantIds);

    if (participantIds.length === 0) {
      setParticipantUsers([]);
      return;
    }

    let cancelled = false;

    const fetchParticipants = async () => {
      try {
        const ids = participantIds.slice(0, 30);

        const users = await Promise.all(
          ids.map((id) =>
            apiService.get<User>(`/users/${id}`, {
              Authorization: `Bearer ${token}`,
            })
          )
        );

        if (!cancelled) {
          setParticipantUsers(users);
        }
      } catch (error) {
        console.error("Failed to fetch participants:", error);

        if (!cancelled) {
          setParticipantUsers([]);
        }
      }
    };

    fetchParticipants();

    return () => {
      cancelled = true;
    };
  }, [selectedEvent, token, apiService]);

  // #49 — Subscribe in background to all user events and show a notification on new messages
  useEffect(() => {
    if (!ENABLE_CHAT_NOTIFICATIONS) return;
    if (!userId || !token || !isMounted) return;

    const sockJsUrl = getApiDomain().replace(/\/$/, "") + "/ws";

    const setup = async () => {
      try {
        const events = await apiService.get<EventDTO[]>(
          `/users/${userId}/events`,
          { Authorization: `Bearer ${token}` }
        );

        const client = new Client({
          webSocketFactory: () => new SockJS(sockJsUrl),
          reconnectDelay: 0,
          connectionTimeout: 5000,
          onConnect: () => {
            events.forEach((event) => {
              client.subscribe(`/topic/chat/${event.id}`, (frame) => {
                if (chatEventRef.current?.id === event.id) return;
                const msg: Message = JSON.parse(frame.body);
                const preview = msg.content.length > 60
                  ? msg.content.slice(0, 60) + "…"
                  : msg.content;
                const key = `msg-${event.id}-${Date.now()}`;
                const notifColor = event.category ? CATEGORY_COLORS[event.category] : "#75bd9d";
                const notifIcon = event.category ? CATEGORY_ICONS[event.category] : CATEGORY_ICONS.OTHER;
                notificationApi.open({
                  key,
                  title: event.title,
                  message: (
                    <span style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 14 }}>
                      {event.title}
                    </span>
                  ),
                  description: (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>
                      <span style={{ color: notifColor, fontWeight: 600 }}>{msg.senderUsername}</span>
                      {": "}{preview}
                    </span>
                  ),
                  icon: (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: notifColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" dangerouslySetInnerHTML={{ __html: notifIcon }} />
                    </div>
                  ),
                  style: {
                    backgroundColor: "#16181D",
                    border: `1px solid ${notifColor}55`,
                    borderRadius: 16,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${notifColor}22`,
                    cursor: "pointer",
                  },
                  duration: 6,
                  onClick: () => {
                    notificationApi.destroy(key);
                    handleOpenChat(event);
                  },
                });
              });
            });
          },
        });

        client.activate();
        notifClientRef.current = client;
      } catch {
        // silently ignore notification setup failures
      }
    };

    setup();

    return () => {
      notifClientRef.current?.deactivate();
      notifClientRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token, isMounted]);

  // Map initialization — runs after auth guard confirms isMounted + token
  useEffect(() => {
    if (!isMounted || !token) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Mapbox token is missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local");
      return;
    }
    if (!mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    

    const fetchAndDisplayEvents = async (map: mapboxgl.Map, center: [number, number], categories: Set<EventCategory>) => {
      try {
        const [lng, lat] = center;
        let url = `/events?longitude=${lng}&latitude=${lat}&radius=20`;
        if (categories.size > 0) {
          categories.forEach((cat) => { url += `&categories=${cat}`; });
        }
        if (includePastRef.current) url += `&includePast=true`;
        const events = await apiService.get<EventDTO[]>(url, { Authorization: `Bearer ${token}` });
        const visible = events.filter(
          (event) => !event.isPrivate || getParticipantIds(event).includes(Number(userId)),
        );

        await renderEventMarkers(map, visible);

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
          positionOptions: { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 },
          trackUserLocation: true,
          showUserHeading: true,
      
        })
      );

      map.on("load", () => {
        mapCenterRef.current = center;
        fetchAndDisplayEvents(map, center, activeCategories);
      });

      map.on("moveend", () => {
        const c = map.getCenter();
        mapCenterRef.current = [c.lng, c.lat];
        setSelectedLocation([c.lng, c.lat]);
        fetchAndDisplayEvents(map, [c.lng, c.lat], activeCategories);
      });

      // Click on empty map collapses any open map.
      map.on("click", () => {
        if (chatEventRef.current) handleCloseChat();
      });
    };

    // Render the map immediately on DEFAULT_CENTER, then flyTo the user once geolocation resolves.
    // Avoids blocking first paint on a slow GPS lock.
    initMap(DEFAULT_CENTER);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCenter: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];

          mapCenterRef.current = userCenter;
          mapInstanceRef.current?.flyTo({
            center: userCenter,
            zoom: 12,
          });

          mapInstanceRef.current?.fire("moveend");
        },
        () => {
          console.warn("Could not get user location. Using default center.");
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 60000,
        }
      );
    }

    return () => {
      mapInstanceRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, token, apiService]);

  // Re-fetch markers when category filters or myEventsOnly change
  useEffect(() => {
    if (!mapInstanceRef.current || !token) return;

    const map = mapInstanceRef.current;
    const center = mapCenterRef.current;
    let cancelled = false;

    const fetchAndRefresh = async () => {
      let url = `/events?longitude=${center[0]}&latitude=${center[1]}&radius=20`;

      if (activeCategories.size > 0) {
        activeCategories.forEach((cat) => {
          url += `&categories=${cat}`;
        });
      }
      if (includePast) url += `&includePast=true`;
      try {
        let events = await apiService.get<EventDTO[]>(url, {
          Authorization: `Bearer ${token}`,
        });

        if (myEventsOnly) {
          const uid = Number(userId);
          events = events.filter(
            (e) => e.creatorId === uid || getParticipantIds(e).includes(uid)
          );
        }

        if (friendsOnly) {
          events = events.filter(
            (e) => 
              getParticipantIds(e).some((id) =>
                followedUsers.some((user) => Number(user.id) === Number(id))
              )
            );
          if (followedUsers.length === 0) {
            messageApi.info("You are not following anyone yet.");
          } else if (events.length === 0) {
            messageApi.info("None of your friends are attending any local events.");
          }
        }
        events = events.filter(
          (event) => 
            !event.isPrivate || getParticipantIds(event).includes(Number(userId)),
        );
        if (cancelled || !mapInstanceRef.current) return;

        await renderEventMarkers(map, events);

      } catch (error) {
        console.error("Failed to refresh events:", error);
      }
    };

    fetchAndRefresh();

    return () => {
      cancelled = true;
    };
  }, [
    activeCategories,
    myEventsOnly,
    friendsOnly,
    includePast,
    token,
    apiService,
    userId,
    followedUsers,
  ]);

  useEffect(() => {
    includePastRef.current = includePast;
  }, [includePast]);

  const toggleCategory = (cat: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Address geocoding with 500ms debounce
  useEffect(() => {
    if (!addressQuery.trim() || addressQuery.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressQuery)}.json?access_token=${accessToken}&limit=4`
        );
        const data = await res.json();
        setAddressSuggestions(
          data.features.map((f: { place_name: string; center: [number, number] }) => ({
            place_name: f.place_name,
            center: f.center,
          }))
        );
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const openPanel = () => {
    setSelectedLocation(mapCenterRef.current);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setSelectedLocation(null);
    setAddressQuery("");
    setAddressSuggestions([]);
    form.resetFields();
    setPanelOpen(false);
  };

  const selectSuggestion = (center: [number, number], placeName: string) => {
    setAddressQuery(placeName);
    setAddressSuggestions([]);
    mapInstanceRef.current?.flyTo({ center, zoom: 14 });
  };

  const handleLogout = () => {
    stompClientRef.current?.deactivate();
    notifClientRef.current?.deactivate();
    notifClientRef.current = null;
    setIsMounted(false);
    clearToken();
    clearUserId();
    router.push("/login");
  };

  const handleJoinEvent = async () => {
    if (!selectedEvent) return;
    setJoiningEvent(true);
    try {
      const updated = await apiService.post<EventDTO>(
        `/events/${selectedEvent.id}/participants`,
        { userId: Number(userId) },
        { Authorization: `Bearer ${token}` }
      );
      setSelectedEvent({ ...updated, isParticipant: true });
      messageApi.success("You joined the event!");
      mapInstanceRef.current?.fire("moveend");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to join event";
      messageApi.error(msg);
    } finally {
      setJoiningEvent(false);
    }
  };

  const handleOpenChat = async (event: EventDTO) => {
    chatEventRef.current = event;
    setSelectedEvent(null);

    // Load chat history
    try {
      const history = await apiService.get<Message[]>(
        `/events/${event.id}/messages`,
        { Authorization: `Bearer ${token}` }
      );
      setChatMessages(history);
    } catch {
      setChatMessages([]);
    }

    // Connect via STOMP over SockJS
    const sockJsUrl = getApiDomain().replace(/\/$/, "") + "/ws";
    //close old before opening new
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
    setStompConnected(false);

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      reconnectDelay: 0,
      connectionTimeout: 5000,
        
      onConnect: () => {
        setStompConnected(true);
        client.subscribe(`/topic/chat/${event.id}`, (frame) => {
          const msg: Message = JSON.parse(frame.body);
          setChatMessages((prev) => 
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        });
      },
      onDisconnect: () => {
        setStompConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setStompConnected(false);
      },
    });
    
    stompClientRef.current = client;
    client.activate();
    setChatOpen(true);
  };

  // Auto-open chat when navigated here with ?openChat=eventId
  useEffect(() => {
    if (!isMounted || !token) return;
    const eventId = new URLSearchParams(window.location.search).get("openChat");
    if (!eventId) return;
    const fetchAndOpen = async () => {
      try {
        const event = await apiService.get<EventDTO>(`/events/${eventId}`, { Authorization: `Bearer ${token}` });
        handleOpenChat(event);
      } catch {
        // silently ignore if event not found
      }
    };
    fetchAndOpen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, token]);

  const handleCloseChat = () => {
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
    chatEventRef.current = null;
    setChatOpen(false);
    setStompConnected(false);
    setChatMessages([]);
    setChatInput("");
  };

  const handleLeaveEvent = async (selectedEvent: EventDTO | null) => {
    if (!selectedEvent) return;
    setLeavingEvent(true);
    try {
      await apiService.delete(
        `/events/${selectedEvent.id}/participants/${userId}`,
        { Authorization: `Bearer ${token}` }
      );
      setSelectedEvent({ ...selectedEvent, isParticipant: false , participantCount: (selectedEvent.participantCount ?? 1) - 1 , participants: (selectedEvent.participants ?? []).filter(participant => participant.id !== Number(userId)), participantIds: (selectedEvent.participantIds ?? []).filter(id => Number(id) !== Number(userId)) });
      setParticipantUsers((prev) => prev.filter((u) => Number(u.id) !== Number(userId)));
      console.log("Left event:", selectedEvent);
      messageApi.success("You left the event.");

      if (chatEventRef.current?.id === selectedEvent.id) {
        handleCloseChat();
      }
      
      mapInstanceRef.current?.fire("moveend");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to leave event";
      messageApi.error(msg);
    } finally {
      setLeavingEvent(false);
    }
  };

  const handleUpdateField = async <K extends keyof EventDTO>(
    field: K,
    value: EventDTO[K]
  ) => {
    if (!selectedEvent) return;

    setSavingEdit(true);

    try {
      await apiService.put<EventDTO>(
        `/events/${selectedEvent.id}`,
        {
          [field]: value,
        },
        { Authorization: `Bearer ${token}` }
      );

      const updated = { ...selectedEvent, [field]: value };
      setSelectedEvent(updated);
      mapInstanceRef.current?.fire("moveend");

      setEditingField(null);
      setEditValue("");
      messageApi.success("Event updated");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Update failed";
      messageApi.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteEvent = async (selectedEvent: EventDTO | null) => {
  if (!selectedEvent) return;

  const confirmed = window.confirm("Are you sure you want to delete this event?");
  if (!confirmed) return;

  try {
    await apiService.delete(
      `/events/${selectedEvent.id}`,
      { Authorization: `Bearer ${token}` }
    );

    setSelectedEvent(null);
    messageApi.success("Event deleted.");

    mapInstanceRef.current?.fire("moveend");
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to delete event";

    messageApi.error(msg);
  }
};

  /*
  const handleSubmitRating = async (score: number) => {
    if (!selectedEvent) return;
    setSubmittingRating(true);
    try {
      await apiService.post(`/events/${selectedEvent.id}/ratings`, { score }, { Authorization: `Bearer ${token}` });
      setMyRating(score);
      messageApi.success("Rating submitted");
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "Failed to submit rating");
    } finally { setSubmittingRating(false); }
  };

  const handleFollowUser = async (targetUserId: number) => {
    try {
      await apiService.post(`/users/${targetUserId}/follow`, {}, { Authorization: `Bearer ${token}` });
      await fetchFollowing();
      messageApi.success("Following!");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Failed to follow.");
    }
  };

  const handleUnFollowUser = async (targetUserId: number) => {
    try {
      await apiService.delete<User>(`/users/${targetUserId}/follow`, { Authorization: `Bearer ${token}` });
      await fetchFollowing();
      messageApi.success("Unfollowed.");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Failed to unfollow.");
    }
  };
  */

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text || !stompConnected || !stompClientRef.current || !chatEventRef.current) return;
    stompClientRef.current.publish({
      destination: `/app/chat/${chatEventRef.current.id}`,
      body: JSON.stringify({
        content: text,
        eventId: chatEventRef.current.id,
        token: token,
      }),
    });
    setChatInput("");
  };

  const handleSubmitRating = async (score: number) => {
    if (!selectedEvent) return;
    setSubmittingRating(true);
    try {
      await apiService.post(
        `/events/${selectedEvent.id}/ratings`,
        { score },
        { Authorization: `Bearer ${token}` }
      );
      setMyRating(score);
      messageApi.success("Rating submitted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit rating";
      messageApi.error(msg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmit = async (values: EventFormValues) => {
    const startDayjs = values.startDate
      .hour(values.startTime.hour())
      .minute(values.startTime.minute())
      .second(0);

    const endDayjs = values.endDate
      .hour(values.endTime.hour())
      .minute(values.endTime.minute())
      .second(0);

    if (startDayjs.isBefore(new Date())) {
      messageApi.error("Start time cannot be in the past.");
      return;
    }

    if (!endDayjs.isAfter(startDayjs)) {
      messageApi.error("End time must be after start time.");
      return;
    }

    // Read the exact coordinate under the green pin tip at submit time.
    // The pin tip is at (50%, 50%) of the map div after the transform fix,
    // so unproject([w/2, h/2]) gives the correct geographic coordinate.
    let lng: number, lat: number;
    if (mapRef.current && mapInstanceRef.current) {
      const { width, height } = mapRef.current.getBoundingClientRect();
      const lngLat = mapInstanceRef.current.unproject([width / 2, height / 2]);
      lng = lngLat.lng;
      lat = lngLat.lat;
    } else {
      [lng, lat] = selectedLocation ?? mapCenterRef.current;
    }

    const payload = {
      title: values.title,
      description: values.description,
      startTime: startDayjs.format("YYYY-MM-DDTHH:mm:ss"),
      endTime: endDayjs.format("YYYY-MM-DDTHH:mm:ss"),
      longitude: lng,
      latitude: lat,
      isPrivate: values.privacy === "private",
      category: values.category,
    };

    try {
      await apiService.post<EventDTO>("/events", payload, { Authorization: `Bearer ${token}` });
      closePanel();
      mapInstanceRef.current?.fire("moveend");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create event. Please try again.";
      messageApi.error(msg);
    }
  };

  const handleJoinByInviteCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const values: EventJoinFormValues = {
        inviteCode: formData.get("inviteCode") as string,
    };

    if (!values.inviteCode) {
      messageApi.error("Please enter an invite code.");
      return;
    }

    setJoiningEvent(true);
    try {
      const response = await apiService.post<EventDTO>("/events/participants",
        { inviteCode: values.inviteCode, userId: Number(userId) },
        { Authorization: `Bearer ${token}` }
      );
      messageApi.success("You joined the event!");
      mapInstanceRef.current?.flyTo({
        center: [response.longitude, response.latitude],
        zoom: 14,
      });
      mapInstanceRef.current?.fire("moveend");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const msg = raw.includes("404") || raw.includes("not found")
        ? "Invalid invite code. Please check and try again."
        : raw.includes("409") || raw.includes("already")
        ? "You are already a participant of this event."
        : "Something went wrong. Please try again.";
      messageApi.error(msg);
    } finally { setJoiningEvent(false); }
  };

  const handleFollowUser = async (targetUserId: number | null) => {
    try {
      await apiService.post(`/users/${targetUserId}/follow`,
        {},
        { Authorization: `Bearer ${token}` }
      );
      
      await fetchFollowing();
      messageApi.success(`You are now following ${targetUserId}`);
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to follow.";
      messageApi.error(msg);
    }
  };

  const handleUnFollowUser = async (targetUserId: number | null) => {
    try {
      await apiService.delete<User>(`/users/${targetUserId}/follow`,
        { Authorization: `Bearer ${token}` }
      );
      
      await fetchFollowing();
      messageApi.success(`You unfollowed ${targetUserId}`);
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to unfollow.";
      messageApi.error(msg);
    }
  };

  if (!isMounted) {
    return (
      <main
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#475569",
          fontSize: "16px",
        }}
      >
        Loading application...
      </main>
    );
  }

  if (!token) {
    return (
      <main
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#475569",
          fontSize: "16px",
        }}
      >
        Redirecting to login...
      </main>
    );
  }

  const isCreator = selectedEvent !== null && Number(userId) === selectedEvent.creatorId;

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", overflow: "hidden" }}>
        {/* Chat panel — left side */}
        {chatOpen && chatEventRef.current && (() => {
          const chatEvent = chatEventRef.current!;
          const catColor = chatEvent.category ? CATEGORY_COLORS[chatEvent.category] : "#75bd9d";
          return (
            <div style={{ width: "360px", height: "100%", display: "flex", flexDirection: "column", flexShrink: 0, backgroundImage: `linear-gradient(180deg, ${catColor} 0%, ${catColor}99 10%, ${catColor}22 25%, #0a0a0a 45%)`, backgroundColor: "#0a0a0a", boxShadow: "2px 0 12px rgba(0,0,0,0.5)" }}>

              {/* Header */}
              <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={handleCloseChat} className="hover-button" style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chatEvent.title}
                  </h3>
                  {chatEvent.category && (
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.65)" }}>
                      {CATEGORY_LABELS[chatEvent.category]} · {chatEvent.participantCount ?? 0} participants
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {chatMessages.length === 0 && (
                  <p style={{ color: "#6b7280", textAlign: "center", marginTop: 32, fontSize: 13 }}>
                    No messages yet. Be the first!
                  </p>
                )}
                {chatMessages.map((msg) => {
                  const isOwn = msg.senderUsername === user?.username;
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                      {!isOwn && (
                        <span style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3, marginLeft: 4 }}>{msg.senderUsername}</span>
                      )}
                      <div style={{
                        maxWidth: "78%",
                        padding: "9px 13px",
                        borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        backgroundColor: isOwn ? catColor : "#23262d",
                        color: "#fff",
                        fontSize: 14,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: 1.45,
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 10, color: "#6b7280", marginTop: 3, marginLeft: isOwn ? 0 : 4, marginRight: isOwn ? 4 : 0 }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 14px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
                <input
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  style={{ flex: 1, height: 42, borderRadius: 999, border: "1px solid #2e3138", backgroundColor: "#23262d", color: "#fff", padding: "0 16px", fontSize: 14, outline: "none" }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || !stompConnected}
                  className="hover-button"
                  style={{ height: 42, borderRadius: 999, border: "none", backgroundColor: catColor, color: "#fff", fontWeight: 600, fontSize: 13, padding: "0 18px", cursor: "pointer", opacity: (!chatInput.trim() || !stompConnected) ? 0.5 : 1, flexShrink: 0 }}
                >
                  {stompConnected ? "Send" : "…"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />

          {locationEventsOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(2px)",
              }}
              onClick={() => setLocationEventsOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 430,
                  maxWidth: "calc(100vw - 32px)",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  backgroundColor: "#0f1115",
                  border: "1px solid #000",
                  borderRadius: 20,
                  padding: 16,
                  boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setLocationEventsOpen(false)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    width: 28,
                    height: 28,
                    border: "none",
                    background: "transparent",
                    color: "#fff",
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>

                <p
                  style={{
                    color: "#9ca3af",
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    margin: "0 0 12px 0",
                  }}
                >
                  Events · {eventsAtLocation.length}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {eventsAtLocation.map((event) => {
                    const catColor = event.category
                      ? CATEGORY_COLORS[event.category]
                      : "#94a3b8";

                    const catIcon = event.category
                      ? CATEGORY_ICONS[event.category]
                      : CATEGORY_ICONS.OTHER;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        style={{
                          backgroundColor: "#16181D",
                          borderRadius: 14,
                          padding: "12px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          border: "1px solid #000",
                          transition: "border-color 0.15s, background-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = catColor + "66";
                          e.currentTarget.style.backgroundColor = "#1d2129";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#000";
                          e.currentTarget.style.backgroundColor = "#16181D";
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            backgroundColor: catColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            dangerouslySetInnerHTML={{ __html: catIcon }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 14,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {event.title}
                          </p>

                          <p
                            style={{
                              margin: "2px 0 0 0",
                              color: "#6b7280",
                              fontSize: 12,
                            }}
                          >
                            {new Date(event.startTime).toLocaleDateString([], {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}

                            <span
                              style={{
                                color: catColor,
                                marginLeft: 6,
                                fontWeight: 500,
                              }}
                            >
                              {event.category
                                ? CATEGORY_LABELS[event.category]
                                : CATEGORY_LABELS.OTHER}
                            </span>
                          </p>
                        </div>

                        {event.isPrivate && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#6b7280",
                              backgroundColor: "#23262d",
                              padding: "2px 8px",
                              borderRadius: 999,
                              flexShrink: 0,
                            }}
                          >
                            Private
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <style jsx global>{`
            .location-events-modal .ant-modal-content {
              background: #0f1115 !important;
              border: 1px solid #000 !important;
              border-radius: 24px !important;
              padding: 0 !important;
              overflow: hidden !important;
              box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55) !important;
            }

            .location-events-modal .ant-modal-body {
              padding: 0 !important;
              background: #0f1115 !important;
              border-radius: 24px !important;
            }

            .location-events-modal .ant-modal-close {
              color: #fff !important;
              top: 12px !important;
              right: 12px !important;
            }
          `}</style>

          {/* Brand overlay */}
          <div style={{
            position: "absolute",
            top: 12,
            left: 16,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(8px)",
            borderRadius: "999px",
            padding: "8px 14px 8px 8px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
          }}>
            <svg width="26" height="33" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pin-grad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#833ab4"/>
                  <stop offset="50%" stopColor="#fd1d1d"/>
                  <stop offset="100%" stopColor="#fcb045"/>
                </linearGradient>
              </defs>
              <path d="M14 1 C7 1 1 6.5 1 13 C1 20.5 14 35 14 35 C14 35 27 20.5 27 13 C27 6.5 21 1 14 1 Z" fill="url(#pin-grad)"/>
              <circle cx="14" cy="12.5" r="5.5" fill="rgba(0,0,0,0.35)"/>
              <path d="M15.5 7 L11 13.5 L14 13.5 L12.5 18.5 L17 12 L14 12 Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "-0.2px" }}>Spontaneo</span>
          </div>

          {/* Filter pills overlay */}
          <div style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "center",
            padding: "8px 12px",
            backgroundColor: "rgba(16,18,24,0.82)",
            backdropFilter: "blur(12px)",
            borderRadius: "999px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
            maxWidth: "calc(100% - 32px)",
          }}>
            <button
              onClick={() => setMyEventsOnly((v) => !v)}
              className="hover-button"
              style={{
                padding: "3px 11px",
                borderRadius: "999px",
                border: "2px solid #f59e0b",
                backgroundColor: myEventsOnly ? "#f59e0b" : "transparent",
                color: myEventsOnly ? "#fff" : "#f59e0b",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              ★ My Events
            </button>

            <button
              onClick={() => setFriendsOnly((v) => !v)}
              className="hover-button"
              style={{
                padding: "3px 11px",
                borderRadius: "999px",
                border: "2px solid #10b981",
                backgroundColor: friendsOnly ? "#10b981" : "transparent",
                color: friendsOnly ? "#fff" : "#10b981",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              👥 Friends Only
            </button>

            <button
              onClick={() => setIncludePast((v) => !v)}
              className="hover-button"
              style={{
                padding: "3px 11px",
                borderRadius: "999px",
                border: "2px solid #64748b",
                backgroundColor: includePast ? "#64748b" : "transparent",
                color: includePast ? "#fff" : "#64748b",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              🕘 Past Events
            </button>

            <div style={{ width: 1, height: 20, backgroundColor: "#3a3f4a", margin: "0 2px", alignSelf: "center" }} />

            {ALL_CATEGORIES.map((cat) => {
              const active = activeCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="hover-button"
                  style={{
                    padding: "3px 11px",
                    borderRadius: "999px",
                    border: `2px solid ${CATEGORY_COLORS[cat]}`,
                    backgroundColor: active ? CATEGORY_COLORS[cat] : "transparent",
                    color: active ? "#fff" : CATEGORY_COLORS[cat],
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
            {activeCategories.size > 0 && (
              <button
                onClick={() => setActiveCategories(new Set())}
                className="hover-button"
                style={{
                  padding: "3px 11px",
                  borderRadius: "999px",
                  border: "2px solid #9ca3af",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
          {panelOpen && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-30px, -72px)",
              pointerEvents: "none", zIndex: 1,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 78" width="60" height="78" style={{ filter: "drop-shadow(0 4px 10px rgba(131,58,180,0.5))" }}>
                <circle cx="30" cy="30" r="28" fill="#833ab4"/>
                <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
                <polygon points="30,76 20,52 40,52" fill="#833ab4"/>
                <g transform="translate(14,14)">
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* Create event panel — right side */}
        {panelOpen && (
          <div style={{ width: "320px", height: "100%", display: "flex", flexDirection: "column", flexShrink: 0, backgroundImage: `linear-gradient(180deg, #833ab4 0%, #833ab499 8%, #833ab422 18%, #0a0a0a 32%)`, backgroundColor: "#0a0a0a", boxShadow: "-2px 0 12px rgba(0,0,0,0.5)" }}>

            {/* Header */}
            <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <button onClick={closePanel} className="hover-button" style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Create Event</h2>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.65)" }}>
                  Pan the map to set location
                </span>
              </div>
            </div>

            {/* Scrollable form area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px" }}>

              {/* Address search */}
              <div style={{ marginBottom: 16, position: "relative" }}>
                <p style={{ color: "#6b7280", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px 0" }}>Location</p>
                <input
                  placeholder="Search address (optional)"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  style={{ width: "100%", height: 40, borderRadius: 999, border: "1px solid #2e3138", backgroundColor: "#23262d", color: "#fff", padding: "0 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {addressSuggestions.length > 0 && (
                  <div style={{ position: "absolute", zIndex: 10, width: "100%", backgroundColor: "#23262d", border: "1px solid #2e3138", borderRadius: 12, marginTop: 4, overflow: "hidden" }}>
                    {addressSuggestions.map((s) => (
                      <div
                        key={s.place_name}
                        onClick={() => selectSuggestion(s.center, s.place_name)}
                        style={{ padding: "9px 14px", cursor: "pointer", color: "#d1d5db", fontSize: 13, borderBottom: "1px solid #2e3138" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2e3138")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {s.place_name}
                      </div>
                    ))}
                  </div>
                )}
                {selectedLocation && (
                  <p style={{ color: "#4b5563", fontSize: 11, margin: "5px 0 0 4px" }}>
                    📍 {selectedLocation[1].toFixed(5)}, {selectedLocation[0].toFixed(5)}
                  </p>
                )}
              </div>

              <ConfigProvider theme={{
                token: {
                  colorBgContainer: "#23262d",
                  colorText: "#fff",
                  colorTextPlaceholder: "#6b7280",
                  colorBgElevated: "#23262d",
                  colorBorder: "#2e3138",
                  colorIcon: "#9ca3af",
                  colorIconHover: "#fff",
                  colorTextHeading: "#9ca3af",
                  colorTextLabel: "#9ca3af",
                  colorTextDisabled: "#4b5563",
                  colorPrimary: "#833ab4",
                  borderRadius: 10,
                },
                components: {
                  Segmented: {
                    trackBg: "#16181D",
                    itemSelectedBg: "#833ab4",
                    itemSelectedColor: "#fff",
                    itemColor: "#9ca3af",
                    itemHoverColor: "#fff",
                    motionDurationSlow: ".15s",
                    controlHeight: 40,
                    borderRadius: 999,
                    borderRadiusSM: 999,
                    borderRadiusLG: 999,
                  },
                  Form: {
                    labelColor: "#9ca3af",
                    labelFontSize: 12,
                  },
                }
              }}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Form.Item label="Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
                    <Input placeholder="Event title" />
                  </Form.Item>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: "Required" }]} style={{ flex: 1 }}>
                      <DatePicker style={{ width: "100%" }} disabledDate={(current) => current && current.isBefore(new Date(), "day")} />
                    </Form.Item>
                    <Form.Item label="Start Time" name="startTime" rules={[{ required: true, message: "Required" }]} style={{ flex: 1 }}>
                      <TimePicker style={{ width: "100%" }} format="HH:mm" />
                    </Form.Item>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Form.Item label="End Date" name="endDate" rules={[{ required: true, message: "Required" }]} style={{ flex: 1 }}>
                      <DatePicker style={{ width: "100%" }} disabledDate={(current) => current && current.isBefore(new Date(), "day")} />
                    </Form.Item>
                    <Form.Item label="End Time" name="endTime" rules={[{ required: true, message: "Required" }]} style={{ flex: 1 }}>
                      <TimePicker style={{ width: "100%" }} format="HH:mm" />
                    </Form.Item>
                  </div>

                  <Form.Item label="Description" name="description" rules={[{ required: true, message: "Description is required" }]}>
                    <Input.TextArea placeholder="Brief description" rows={3} style={{ resize: "none" }} />
                  </Form.Item>

                  <Form.Item label="Category" name="category" rules={[{ required: true, message: "Category is required" }]}>
                    <Select placeholder="Select a category">
                      {ALL_CATEGORIES.map((cat) => (
                        <Select.Option key={cat} value={cat}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: CATEGORY_COLORS[cat], display: "inline-block", flexShrink: 0 }} />
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Privacy" name="privacy" initialValue="private">
                    <Segmented
                      style={{ caretColor: "transparent", width: "100%" }}
                      options={[
                        { label: <span><LockOutlined /> Private</span>, value: "private" },
                        { label: <span><GlobalOutlined /> Public</span>, value: "public" },
                      ]}
                      block
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <button
                      type="submit"
                      className="hover-button"
                      style={{ width: "100%", height: 48, borderRadius: 999, border: "none", background: "linear-gradient(135deg, #833ab4, #6a2d93)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(131,58,180,0.35)" }}
                    >
                      Create Event
                    </button>
                  </Form.Item>
                </Form>
              </ConfigProvider>
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (() => {
          const catColor = selectedEvent.category ? CATEGORY_COLORS[selectedEvent.category] : "#75bd9d";
          const catIcon = selectedEvent.category ? CATEGORY_ICONS[selectedEvent.category] : CATEGORY_ICONS.OTHER;
          const fmt = (d: string) => {

            const dt = new Date(d);
            return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()} · ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
          };
          const card = { backgroundColor: "#23262d", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.25)" };
          const label = { color: "#6b7280", fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 };
          const value = { margin: "5px 0 0 0", color: "#f3f4f6", fontWeight: 600, fontSize: 15 };
          return (
            /* Backdrop */
            <div
              style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
              onClick={() => setSelectedEvent(null)}
            >
            {/* Card */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: 400, maxHeight: "88vh", overflowY: "auto", borderRadius: 24, boxShadow: "0 12px 48px rgba(0,0,0,0.5)", background: `linear-gradient(180deg, ${catColor} 0%, ${catColor}99 18%, ${catColor}33 40%, #16181D 62%)` }}
            >
            <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${catColor}55, ${catColor})`, border: `2px solid ${catColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" dangerouslySetInnerHTML={{ __html: catIcon }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{selectedEvent.title}</h2>
                    {selectedEvent.category && <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{CATEGORY_LABELS[selectedEvent.category]}</span>}
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="hover-button" style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
              </div>

              {/* Description */}
              <div style={card}>
                <span style={label}>Description</span>
                {editingField === "description" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    <Input.TextArea autoFocus rows={3} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button className="hover-button" style={{ width: 100, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }} loading={savingEdit} onClick={() => handleUpdateField("description", editValue)}>Save</Button>
                      <Button className="hover-button" style={{ width: 100, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "transparent", color: "#f87171", fontWeight: 500, fontSize: 14, cursor: "pointer" }} onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ ...value, fontWeight: 400, fontSize: 14, lineHeight: 1.6, color: "#d1d5db" }}>{selectedEvent.description ?? "No description."}</p>
                    {isCreator && (
                      <button className="hover-button" onClick={() => { setEditingField("description"); setEditValue(selectedEvent.description ?? ""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 14, flexShrink: 0 }}>✏️</button>
                    )}
                  </div>
                )}
              </div>

              {/* Organizer + Participants */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ ...card, flex: 1 }}>
                  <span style={label}>Organizer</span>
                  <p style={value}>{selectedEvent.creatorUsername ?? "—"}</p>
                </div>
                <div style={{ ...card, flex: 1 }}>
                  <span style={label}>Participants</span>
                  <p style={value}>{selectedEvent.participantCount ?? 0}</p>
                </div>
              </div>

              {/* Participants list with follow/unfollow */}
              
              {participantUsers.length > 0 && (
                <div style={card}>
                  <span style={label}>Participants ({participantUsers.length})</span>
                  <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto", paddingRight: "15px" }}>
                    {participantUsers.map((p) => {
                      const isMe = Number(p.id) === Number(userId);
                      const isFollowing = followedUsers.some((u) => Number(u.id) === Number(p.id));
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <button
                            onClick={() => { setSelectedEvent(null); router.push(`/users/${p.id}`); }}
                            className="hover-button"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#f3f4f6", fontSize: 14, fontWeight: 500, padding: 0, textAlign: "left" }}
                          >
                            {p.username ?? `User ${p.id}`}
                          </button>
                          {!isMe && (
                            <button
                              onClick={() => isFollowing ? handleUnFollowUser(Number(p.id)) : handleFollowUser(Number(p.id))}
                              className="hover-button"
                              style={{ padding: "2px 12px", borderRadius: 999, border: `1.5px solid ${isFollowing ? "#3a3f4a" : catColor}`, backgroundColor: isFollowing ? "transparent" : catColor, color: isFollowing ? "#9ca3af" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                            >
                              {isFollowing ? "Unfollow" : "Follow"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dates — single card */}
              <div style={card}>
                <span style={label}>Start</span>
                <p style={{ ...value, marginBottom: 12 }}>{fmt(selectedEvent.startTime)}</p>
                <div style={{ height: 1, backgroundColor: "#2e3138", margin: "0 0 12px" }} />
                <span style={label}>End</span>
                <p style={{ ...value, marginBottom: 0 }}>{fmt(selectedEvent.endTime)}</p>
              </div>



              {/* Invite code */}
              {isCreator && selectedEvent.inviteCode && (
                <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={label}>Invite Code</span>
                    <p style={{ ...value, fontFamily: "monospace", letterSpacing: 2 }}>
                      {selectedEvent.inviteCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {navigator.clipboard.writeText(selectedEvent.inviteCode ?? ""); messageApi.success("Invite code copied");}}
                    className="hover-button"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: catColor,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Rate organizer */}
              {!isCreator && selectedEvent.isParticipant && (
                <div style={card}>
                  <span style={label}>Event Rating</span>

                  {new Date(selectedEvent.endTime) < new Date() ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                      <ConfigProvider theme={{ token: { colorFillContent: catColor, colorFillContentHover: catColor } }}>
                        <Rate
                          value={myRating ?? 0}
                          onChange={handleSubmitRating}
                          disabled={submittingRating || myRating !== null}
                          style={{ color: catColor, fontSize: 22 }}
                        />
                      </ConfigProvider>

                      {myRating !== null && (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          You rated {myRating}/5
                        </span>
                      )}

                      {submittingRating && (
                        <span style={{ color: "#6b7280", fontSize: 12 }}>Saving…</span>
                      )}
                    </div>
                  ) : (
                    <p style={{ ...value, color: "#9ca3af", fontSize: 13 }}>
                      Available after the event is over.
                    </p>
                  )}
                </div>
              )}

              {/* Photos */}
              {selectedEvent.pictureUrls && selectedEvent.pictureUrls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedEvent.pictureUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Event photo ${i + 1}`} style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 10 }} />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {!isCreator && !selectedEvent.isParticipant && (
                  <button onClick={handleJoinEvent} disabled={joiningEvent} className="hover-button"
                    style={{ width: "100%", height: 48, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {joiningEvent ? "Joining…" : "Join Event"}
                  </button>
                )}
                {(selectedEvent.isParticipant || isCreator) && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleOpenChat(selectedEvent)} className="hover-button"
                      style={{ flex: 1, height: 48, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                      Join Chat
                    </button>
                    {!isCreator && (
                      <button onClick={() => handleLeaveEvent(selectedEvent)} disabled={leavingEvent} className="hover-button"
                        style={{ flex: 1, height: 48, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "#23262d", color: "#f87171", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                        {leavingEvent ? "Leaving…" : "Leave Event"}
                      </button>
                    )}
                  </div>
                )}
                <button onClick={() => router.push(`/events/${selectedEvent.id}/board?title=${encodeURIComponent(selectedEvent.title)}`)}
                  className="hover-button"
                  style={{ width: "100%", height: 48, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "#23262d", color: "#f3f4f6", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                  View Board
                </button>
                {isCreator && (
                  <button onClick={() => handleDeleteEvent(selectedEvent)} className="hover-button"
                    style={{ width: "100%", height: 44, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "transparent", color: "#f87171", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                    Delete Event
                  </button>
                )}
              </div>
            </div>
            </div>
            </div>
          );
        })()}

      {/* Bottom navigation */}
      <div style={{
        position: "relative",
        height: 72,
        backgroundColor: "#16181D",
        borderTop: "1px solid #2a2d35",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        paddingBottom: 8,
      }}>
        {/* Drop a pin — absolutely centered in the nav */}
        <button
          onClick={panelOpen ? closePanel : openPanel}
          className="hover-button"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: panelOpen ? "#23262d" : "linear-gradient(135deg, #833ab4, #6a2d93)",
            border: panelOpen ? "1.5px solid #3a3f4a" : "none",
            borderRadius: 999,
            height: 52,
            padding: "0 24px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: panelOpen ? "none" : "0 4px 24px rgba(131,58,180,0.5)",
            whiteSpace: "nowrap",
            transition: "background 0.2s, box-shadow 0.2s",
            zIndex: 1,
          }}
        >
          {panelOpen ? (
            <>
              <PlusOutlined style={{ fontSize: 13, transform: "rotate(45deg)" }} />
              Cancel
            </>
          ) : (
            <>
              <svg width="26" height="33" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="fab-pin-grad" x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#833ab4"/>
                    <stop offset="50%" stopColor="#fd1d1d"/>
                    <stop offset="100%" stopColor="#fcb045"/>
                  </linearGradient>
                </defs>
                <path d="M14 1 C7 1 1 6.5 1 13 C1 20.5 14 35 14 35 C14 35 27 20.5 27 13 C27 6.5 21 1 14 1 Z" fill="url(#fab-pin-grad)"/>
                <circle cx="14" cy="12.5" r="5.5" fill="rgba(0,0,0,0.35)"/>
                <path d="M15.5 7 L11 13.5 L14 13.5 L12.5 18.5 L17 12 L14 12 Z" fill="white"/>
              </svg>
              Drop a pin
            </>
          )}
        </button>
        {/* Explore */}
        <button
          onClick={() => {}}
          className="hover-button"
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 }}
        >
          <CompassOutlined style={{ fontSize: 22, color: "#fff" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Explore</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#833ab4", marginTop: -2 }} />
        </button>

        {/* spacer — keeps Explore left and Profile right */}
        <div style={{ flex: 1 }} />

        {/* Profile */}
        <button
          onClick={() => router.push(`/users/${userId}`)}
          className="hover-button"
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 }}
        >
          <UserOutlined style={{ fontSize: 22, color: "#6b7280" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Profile</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "transparent", marginTop: -2 }} />
        </button>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import { App, Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented, Modal, Select } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventCategory, EventDTO } from "@/types/event";
import { getApiDomain } from "@/utils/domain";
import { User } from "@/types/user";

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

const DEFAULT_CENTER: [number, number] = [13.405, 52.52]; // Berlin fallback

const CLUSTER_RADIUS = 50;       // px — supercluster grouping radius
const CLUSTER_MAX_ZOOM = 16;     // beyond this zoom we stop clustering
const SPIDER_LEAF_RADIUS = 64;   // px — distance from cluster centre to each spider leaf
const SPIDER_LEAF_RADIUS_PER_LEAF = 3; // grow the circle a bit when many leaves

type EventFeatureProps = { event: EventDTO };

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
  const chatEventRef = useRef<EventDTO | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [followedUserIds, setFollowedUserIds] = useState<number[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(new Set());
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const [leavingEvent, setLeavingEvent] = useState(false);
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
  const { message: messageApi } = App.useApp();

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const [isMounted, setIsMounted] = useState(false);

  const clearSpider = useCallback(() => {
    spiderMarkersRef.current.forEach((m) => m.remove());
    spiderMarkersRef.current = [];
    spiderClusterIdRef.current = null;
  }, []);

  const clearAllMarkers = useCallback(() => {
    clearSpider();
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, [clearSpider]);

  const spiderfy = useCallback(
    (clusterId: number, lngLat: [number, number], leaves: EventDTO[]) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      clearSpider();
      spiderClusterIdRef.current = clusterId;

      const n = leaves.length;
      const radius = SPIDER_LEAF_RADIUS + Math.max(0, n - 8) * SPIDER_LEAF_RADIUS_PER_LEAF;

      leaves.forEach((event, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative; width:0; height:0;";

        const line = document.createElement("div");
        line.className = "spider-line";
        line.style.transform = `rotate(${angle}rad)`;
        line.style.width = "0px";
        wrapper.appendChild(line);

        const leaf = document.createElement("div");
        leaf.className = "spider-leaf";
        leaf.style.transform = "translate(0px, 0px)";
        leaf.innerHTML = buildPinSvg(event.category);
        leaf.title = event.title;
        leaf.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSelectedEvent(event);
        });
        wrapper.appendChild(leaf);

        const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
          .setLngLat(lngLat)
          .addTo(map);
        spiderMarkersRef.current.push(marker);

        // Animate outward on next frame so the transition fires
        requestAnimationFrame(() => {
          leaf.style.transform = `translate(${dx}px, ${dy}px)`;
          line.style.width = `${radius}px`;
        });
      });
    },
    [clearSpider],
  );

  const renderClusters = useCallback(
    (events: EventDTO[]) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      clearAllMarkers();

      const features: Supercluster.PointFeature<EventFeatureProps>[] = events.map((event) => ({
        type: "Feature",
        properties: { event },
        geometry: { type: "Point", coordinates: [event.longitude, event.latitude] },
      }));

      const index = new Supercluster<EventFeatureProps>({
        radius: CLUSTER_RADIUS,
        maxZoom: CLUSTER_MAX_ZOOM,
      });
      index.load(features);
      superclusterRef.current = index;

      const bounds = map.getBounds();
      if (!bounds) return;
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.floor(map.getZoom());
      const clusters = index.getClusters(bbox, zoom);

      clusters.forEach((feat) => {
        const [lng, lat] = feat.geometry.coordinates as [number, number];
        const props = feat.properties as Supercluster.AnyProps;

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const total = props.point_count as number;
          const leaves = index.getLeaves(clusterId, Infinity) as Supercluster.PointFeature<EventFeatureProps>[];
          const counts: Partial<Record<EventCategory, number>> = {};
          for (const leaf of leaves) {
            const cat = leaf.properties.event.category ?? "OTHER";
            counts[cat] = (counts[cat] ?? 0) + 1;
          }
          const element = buildClusterElement(counts, total);
          element.addEventListener("click", (ev) => {
            ev.stopPropagation();
            // If this same cluster is already spiderfied, collapse it.
            if (spiderClusterIdRef.current === clusterId) {
              clearSpider();
              return;
            }
            const expansionZoom = index.getClusterExpansionZoom(clusterId);
            if (expansionZoom <= CLUSTER_MAX_ZOOM) {
              clearSpider();
              map.easeTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
            } else {
              spiderfy(
                clusterId,
                [lng, lat],
                leaves.map((l) => l.properties.event),
              );
            }
          });
          const marker = new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat([lng, lat])
            .addTo(map);
          markersRef.current.push(marker);
        } else {
          const event = (props as EventFeatureProps).event;
          const wrapper = buildPinElement(event);
          wrapper.addEventListener("click", () => setSelectedEvent(event));
          const marker = new mapboxgl.Marker(wrapper).setLngLat([lng, lat]).addTo(map);
          markersRef.current.push(marker);
        }
      });
    },
    [clearAllMarkers, clearSpider, spiderfy],
  );

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


  useEffect(() => {
    if (!userId || !token) return;

    const fetchUser = async () => {
      try {
        const data = await apiService.get<User>(
          `/users/${userId}`,
          { Authorization: `Bearer ${token}` }
        );

        const ids = (data.following ?? [])
        .map(f => f.id)
        .filter((id): id is string => id !== null)
        .map(id => Number(id));

        setUser(data);
        setFollowedUserIds(ids);

      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
 }, [userId, token, apiService]);

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

    const fetchAndDisplayEvents = async (center: [number, number], categories: Set<EventCategory>) => {
      try {
        const [lng, lat] = center;
        let url = `/events?longitude=${lng}&latitude=${lat}&radius=20`;
        if (categories.size > 0) {
          categories.forEach((cat) => { url += `&categories=${cat}`; });
        }
        const events = await apiService.get<EventDTO[]>(url, { Authorization: `Bearer ${token}` });
        const visible = events.filter(
          (event) => !event.isPrivate || event.participantIds?.includes(Number(userId)),
        );
        renderClusters(visible);
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
        mapCenterRef.current = center;
        fetchAndDisplayEvents(center, activeCategories);
      });

      map.on("moveend", () => {
        const c = map.getCenter();
        mapCenterRef.current = [c.lng, c.lat];
        setSelectedLocation([c.lng, c.lat]);
        fetchAndDisplayEvents([c.lng, c.lat], activeCategories);
      });

      // Click on empty map collapses any open spider.
      map.on("click", () => clearSpider());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, token, apiService]);

  // Re-fetch markers when category filters or myEventsOnly change
  useEffect(() => {
    if (!mapInstanceRef.current || !token) return;
    const center = mapCenterRef.current;
    let cancelled = false;
    const fetchAndRefresh = async () => {
      let url = `/events?longitude=${center[0]}&latitude=${center[1]}&radius=20`;
      if (activeCategories.size > 0) {
        activeCategories.forEach((cat) => { url += `&categories=${cat}`; });
      }
      try {
        let events = await apiService.get<EventDTO[]>(url, { Authorization: `Bearer ${token}` });
        if (myEventsOnly) {
          const uid = Number(userId);
          events = events.filter(e => e.creatorId === uid || e.participantIds?.includes(uid));
        }
        if (friendsOnly) {
          events = events.filter(e =>
            (e.participantIds ?? []).some(id => followedUserIds.includes(id)),
          );
        }
        events = events.filter(
          (event) => !event.isPrivate || event.participantIds?.includes(Number(userId)),
        );
        if (cancelled || !mapInstanceRef.current) return;
        renderClusters(events);
      } catch (error) {
        console.error("Failed to refresh events:", error);
      }
    };
    fetchAndRefresh();
    return () => { cancelled = true; };
  }, [activeCategories, myEventsOnly, friendsOnly, token, apiService, userId, followedUserIds, renderClusters]);

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
    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      onConnect: () => {
        setStompConnected(true);
        client.subscribe(`/topic/chat/${event.id}`, (frame) => {
          const msg: Message = JSON.parse(frame.body);
          setChatMessages((prev) => [...prev, msg]);
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
    client.activate();
    stompClientRef.current = client;
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
      setSelectedEvent({ ...selectedEvent, isParticipant: false , participantCount: (selectedEvent.participantCount ?? 1) - 1 });
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

  const handleUpdateField = async (field: keyof EventDTO, value: EventDTO[keyof EventDTO]) => {
    if (!selectedEvent) return;

    setSavingEdit(true);

    try {
      const updated = await apiService.put<EventDTO>(
        `/events/${selectedEvent.id}`,
        {
          [field]: value,
        },
        { Authorization: `Bearer ${token}` }
      );

      setSelectedEvent((prev) =>
        prev ? { ...prev, [field]: value } : prev
      );

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

  const handleSubmit = async (values: EventFormValues) => {
    const startDayjs = values.startDate
      .hour(values.startTime.hour())
      .minute(values.startTime.minute())
      .second(0);

    const endDayjs = values.endDate
      .hour(values.endTime.hour())
      .minute(values.endTime.minute())
      .second(0);

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
      const msg = error instanceof Error ? error.message : "Failed to join event. Please check the invite code and try again.";
      messageApi.error(msg);
    } finally { setJoiningEvent(false); }
  };


  if (!token) return null;

  const isCreator = selectedEvent !== null && Number(userId) === selectedEvent.creatorId;

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Map</h1>
        <Button
  type="primary"
  onClick={openPanel}
  shape="circle"
  style={{
    width: 40,
    height: 40,
    minWidth: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}
>
  <span style={{ fontSize: 36, fontWeight: 700, position: "relative", top: "-4px" }}>
    +
  </span>
</Button>
        <form onSubmit={handleJoinByInviteCode} style={{ display: "flex", gap: "8px", color: "#fff" }}>
          <input
            name="inviteCode"
            type="text"
            placeholder="  Enter event invite code"
            style={{ fontSize: "18px" }}
          />
          <button type="submit" style={{ backgroundColor: "#1890ff", color: "#fff", border: "none", padding: "10px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "15px" }}>
            Join Event
          </button>
        </form>
        <Button onClick={() => router.push(`/users/${userId}`)} style={{ marginLeft: "auto" }}>
          My Profile
        </Button>
        <Button onClick={handleLogout} style={{ color: "#ef4444", borderColor: "#ef4444" }}>
          Logout
        </Button>
      </div>


      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", overflow: "hidden" }}>
        {/* Chat panel — left side */}
        {chatOpen && chatEventRef.current && (
          <div
            style={{
              width: "360px",
              height: "100%",
              backgroundColor: "#16181D",
              boxShadow: "2px 0 8px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #2e3138",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <Button type="text" onClick={handleCloseChat} style={{ color: "#aaa", padding: "0 4px" }}>
                ←
              </Button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "15px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {chatEventRef.current.title}
                </h3>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  {chatEventRef.current.participantCount ?? 0} participant{chatEventRef.current.participantCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {chatMessages.length === 0 && (
                <p style={{ color: "#6b7280", textAlign: "center", marginTop: "32px", fontSize: "13px" }}>
                  No messages yet. Be the first to say something!
                </p>
              )}
              {chatMessages.map((msg) => {
                const isOwn = msg.senderUsername === user?.username;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isOwn ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isOwn && (
                      <span style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>
                        {msg.senderUsername}
                      </span>
                    )}
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        backgroundColor: "#2e3138",
                        color: "#fff",
                        fontSize: "14px",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {msg.content}
                    </div>
                    <span style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #2e3138",
                display: "flex",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <Input
                placeholder="Type a message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={handleSendMessage}
                style={{ backgroundColor: "#23262d", borderColor: "#444", color: "#fff" }}
              />
              <Button
                type="primary"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || !stompConnected}
                style={{ color: "#fff" }}
              >
                {stompConnected ? "Send" : "Connecting…"}
              </Button>
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />

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
            backgroundColor: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(6px)",
            borderRadius: "999px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            maxWidth: "calc(100% - 32px)",
          }}>
            <button
              onClick={() => setMyEventsOnly((v) => !v)}
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


            <div style={{ width: 1, height: 20, backgroundColor: "#d1d5db", margin: "0 2px", alignSelf: "center" }} />

            {ALL_CATEGORIES.map((cat) => {
              const active = activeCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 78" width="60" height="78" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}>
                <circle cx="30" cy="30" r="28" fill="#22c55e"/>
                <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
                <polygon points="30,76 20,52 40,52" fill="#22c55e"/>
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
          <div
            style={{
              width: "320px",
              height: "100%",
              backgroundColor: "#16181D",
              boxShadow: "-2px 0 8px rgba(0,0,0,0.4)",
              padding: "24px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Create Event</h2>
              <Button type="text" onClick={closePanel} style={{ fontSize: "18px", lineHeight: 1 , color: "white"}}>
                ×
              </Button>
            </div>

            {/* Address search */}
            <div style={{ marginBottom: "16px", position: "relative" }}>
              <p style={{ color: "#aaa", fontSize: "12px", margin: "0 0 6px 0" }}>
                Pan the map to position the green pin on your desired location, or search an address below.
              </p>
              <Input
                placeholder="Search address (optional)"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                style={{ backgroundColor: "#23262d", borderColor: "#444", color: "#fff" }}
              />
              {addressSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", zIndex: 10, width: "100%",
                  backgroundColor: "#23262d", border: "1px solid #444",
                  borderRadius: "6px", marginTop: "4px", overflow: "hidden",
                }}>
                  {addressSuggestions.map((s) => (
                    <div
                      key={s.place_name}
                      onClick={() => selectSuggestion(s.center, s.place_name)}
                      style={{ padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: "13px", borderBottom: "1px solid #333" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2e3138")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {s.place_name}
                    </div>
                  ))}
                </div>
              )}
              {selectedLocation && (
                <p style={{ color: "#666", fontSize: "11px", margin: "4px 0 0 0" }}>
                  📍 {selectedLocation[1].toFixed(5)}, {selectedLocation[0].toFixed(5)}
                </p>
              )}
            </div>

            <ConfigProvider theme={{
              token: { colorBgContainer: "#16181D", colorText: "#fff", colorTextPlaceholder: "#888888", colorBgElevated: "#16181D", colorIcon: "#fff", colorIconHover: "#aaa", colorTextHeading: "#fff", colorTextDisabled: "#555" },
              components: {
                Segmented: {
                  trackBg: "#fff",
                  itemSelectedBg: "#000",
                  itemSelectedColor: "#fff",
                  itemColor: "#000",
                  itemHoverColor: "#000",
                  motionDurationSlow: ".15s",
                  controlHeight: 40,
                }
              }
            }}>
              <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ color: "black" }}>
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[{ required: true, message: "Title is required" }]}
                >
                  <Input placeholder="Event title" />
                </Form.Item>

                <Form.Item
                  label="Start Date"
                  name="startDate"
                  rules={[{ required: true, message: "Start date is required" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Start Time"
                  name="startTime"
                  rules={[{ required: true, message: "Start time is required" }]}
                >
                  <TimePicker style={{ width: "100%" }} format="HH:mm" />
                </Form.Item>

                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[{ required: true, message: "End date is required" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="End Time"
                  name="endTime"
                  rules={[{ required: true, message: "End time is required" }]}
                >
                  <TimePicker style={{ width: "100%" }} format="HH:mm" />
                </Form.Item>

                <Form.Item
                  label="Description"
                  name="description"
                  rules={[{ required: true, message: "Description is required" }]}
                >
                  <Input.TextArea placeholder="Brief description" rows={3} />
                </Form.Item>

                <Form.Item
                  label="Category"
                  name="category"
                  rules={[{ required: true, message: "Category is required" }]}
                >
                  <Select placeholder="Select a category">
                    {ALL_CATEGORIES.map((cat) => (
                      <Select.Option key={cat} value={cat}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: CATEGORY_COLORS[cat], display: "inline-block" }} />
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Privacy" name="privacy" initialValue="private">
                  <Segmented
                    style={{ caretColor: "transparent" }}
                    options={[
                      { label: <span><LockOutlined /> Private</span>, value: "private" },
                      { label: <span><GlobalOutlined /> Public</span>, value: "public" },
                    ]}
                    block
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block>
                    Create
                  </Button>
                </Form.Item>
              </Form>
            </ConfigProvider>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <Modal
        open={selectedEvent !== null}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        title={<span style={{ color: "#111827" }}>{selectedEvent?.title}</span>}
        styles={{ header: { color: "#111827" } }}
        width={480}
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>


            {selectedEvent.category && (
              <div>
                <span style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  backgroundColor: CATEGORY_COLORS[selectedEvent.category],
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                }}>
                  {CATEGORY_LABELS[selectedEvent.category]}
                </span>
              </div>
            )}
            <div>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>Description</span>
              {editingField === "description" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <Input.TextArea
                    autoFocus
                    rows={3}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      type="primary"
                      loading={savingEdit}
                      onClick={() => handleUpdateField("description", editValue)}
                    >
                      Save
                    </Button>
                    <Button onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <p style={{ margin: 0, color: "#111827" }}>
                    {selectedEvent.description ?? "—"}
                  </p>

                  {isCreator && (
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        setEditingField("description");
                        setEditValue(selectedEvent.description ?? "");
                      }}
                    >
                      ✏️
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>Organizer</span>
                <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{selectedEvent.creatorUsername ?? "—"}</p>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>Participants</span>
                <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{selectedEvent.participantCount ?? 0}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>Start</span>
                <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{new Date(selectedEvent.startTime).toLocaleString()}</p>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>End</span>
                <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{new Date(selectedEvent.endTime).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              {isCreator && (
                <div>
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>Your Invite Code - visible to event creators only</span>
                  <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{selectedEvent.inviteCode ?? "—"}</p>
                </div>
              )}
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>Photos</span>
              {selectedEvent.pictureUrls && selectedEvent.pictureUrls.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                  {selectedEvent.pictureUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Event photo ${i + 1}`}
                      style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ margin: "2px 0 0 0", color: "#9ca3af" }}>No photos available</p>
              )}
              {/* Join button — not creator and not yet a participant */}
            {!isCreator && !selectedEvent.isParticipant && (
              <Button type="primary" onClick={handleJoinEvent} loading={joiningEvent} block>
                Join Event
              </Button>
            )}

            {/* Chat + Leave buttons — participant or creator */}
            {(selectedEvent.isParticipant || isCreator) && (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="primary" onClick={() => handleOpenChat(selectedEvent)} block>
                  Join Chat
                </Button>
                {!isCreator && (
                  <Button onClick={() => handleLeaveEvent(selectedEvent)} danger block>
                    Leave Event
                  </Button>
                )}
              </div>
            )}
            </div>
            <Button
              block
              onClick={() => router.push(`/events/${selectedEvent.id}/board?title=${encodeURIComponent(selectedEvent.title)}`)}
            >
              View Board
            </Button>
            {isCreator && (
              <Button onClick={() => handleDeleteEvent(selectedEvent)} danger block>
              Delete Event
              </Button>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}

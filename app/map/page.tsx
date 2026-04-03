"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { App, Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventDTO } from "@/types/event";

interface EventFormValues {
  title: string;
  startDate: Dayjs;
  startTime: Dayjs;
  endDate: Dayjs;
  endTime: Dayjs;
  description: string;
  privacy: "public" | "private";
}

const DEFAULT_CENTER: [number, number] = [13.405, 52.52]; // Berlin fallback

export default function MapPage() {
  const router = useRouter();
  const apiService = useApi();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const [isMounted, setIsMounted] = useState(false);

  // Auth guard — delays check by one render to avoid SSR/localStorage issues
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
    if (!token) {
      window.alert("You are not authenticated. Please log in.");
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

      const marker = new mapboxgl.Marker(markerEl)
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

      markersRef.current.push(marker);
    };

    const fetchAndDisplayEvents = async (map: mapboxgl.Map, center: [number, number]) => {
      try {
        const [lng, lat] = center;
        const events = await apiService.get<EventDTO[]>(
          `/events?longitude=${lng}&latitude=${lat}&radius=20`,
          { Authorization: `Bearer ${token}` }
        );

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

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
        mapCenterRef.current = center;
        fetchAndDisplayEvents(map, center);
      });

      map.on("moveend", () => {
        const c = map.getCenter();
        mapCenterRef.current = [c.lng, c.lat];
        setSelectedLocation([c.lng, c.lat]);
        fetchAndDisplayEvents(map, [c.lng, c.lat]);
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
  }, [isMounted, token, apiService]);

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
    // selectedLocation will update via moveend after flyTo completes
  };

  const handleLogout = () => {
    setIsMounted(false);
    clearToken();
    router.push("/login");
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

    const [lng, lat] = selectedLocation ?? mapCenterRef.current;

    const payload = {
      title: values.title,
      description: values.description,
      startTime: startDayjs.format("YYYY-MM-DDTHH:mm:ss"),
      endTime: endDayjs.format("YYYY-MM-DDTHH:mm:ss"),
      longitude: lng,
      latitude: lat,
      isPrivate: values.privacy === "private",
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

  if (!token) return null;

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>Map</h1>
        <Button type="primary" onClick={openPanel}>
          + Create Event
        </Button>
        <Button onClick={handleLogout} style={{ marginLeft: "auto" }}>
          Logout
        </Button>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
          {panelOpen && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%, -100%)",
              pointerEvents: "none", zIndex: 1,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="40" height="54">
                <path d="M12 0C7.589 0 4 3.589 4 8c0 5.698 7.199 13.518 7.502 13.855a.665.665 0 0 0 .996 0C12.801 21.518 20 13.698 20 8c0-4.411-3.589-8-8-8z" fill="#22c55e"/>
                <circle cx="12" cy="8" r="3.5" fill="white"/>
              </svg>
            </div>
          )}
        </div>

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
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Create Event</h2>
              <Button type="text" onClick={closePanel} style={{ fontSize: "18px", lineHeight: 1 }}>
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
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
    </main>
  );
}

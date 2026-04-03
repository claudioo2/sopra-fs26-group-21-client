"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventDTO } from "@/types/event";

interface EventFormValues {
  title: string;
  date: string;
  time: string;
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [form] = Form.useForm();

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
        fetchAndDisplayEvents(map, center);
      });

      map.on("moveend", () => {
        const c = map.getCenter();
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

  const handleLogout = () => {
    setIsMounted(false);
    clearToken();
    router.push("/login");
  };

  const handleSubmit = (values: EventFormValues) => {
    console.log("New event:", values);
    form.resetFields();
    setPanelOpen(false);
  };

  if (!token) return null;

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>Map</h1>
        <Button type="primary" onClick={() => setPanelOpen(true)}>
          + Create Event
        </Button>
        <Button onClick={handleLogout} style={{ marginLeft: "auto" }}>
          Logout
        </Button>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        <div ref={mapRef} style={{ flex: 1 }} />

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
              <Button type="text" onClick={() => setPanelOpen(false)} style={{ fontSize: "18px", lineHeight: 1 }}>
                ×
              </Button>
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
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Date is required" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Time"
                  name="time"
                  rules={[{ required: true, message: "Time is required" }]}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { App, Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented, Modal } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { Client } from "@stomp/stompjs";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventDTO } from "@/types/event";
import { getApiDomain } from "@/utils/domain";

interface EventFormValues {
  title: string;
  startDate: Dayjs;
  startTime: Dayjs;
  endDate: Dayjs;
  endTime: Dayjs;
  description: string;
  privacy: "public" | "private";
}

interface Message {
  id: number;
  content: string;
  senderUsername: string;
  timestamp: string;
  eventId: number;
}

const DEFAULT_CENTER: [number, number] = [13.405, 52.52]; // Berlin fallback

export default function MapPage() {
  const router = useRouter();
  const apiService = useApi();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const stompClientRef = useRef<Client | null>(null);
  const chatEventRef = useRef<EventDTO | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
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

      markerEl.addEventListener("click", () => {
        setSelectedEvent(event);
      });

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([event.longitude, event.latitude])
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

    // Connect via WebSocket (STOMP over SockJS)
    const wsUrl = getApiDomain().replace(/^http/, "ws") + "/ws";
    const client = new Client({
      brokerURL: wsUrl,
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

  const handleCloseChat = () => {
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
    chatEventRef.current = null;
    setChatOpen(false);
    setStompConnected(false);
    setChatMessages([]);
    setChatInput("");
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

  const isCreator = selectedEvent !== null && Number(userId) === selectedEvent.creatorId;

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>Map</h1>
        <Button type="primary" onClick={openPanel}>
          + Create Event
        </Button>
        <Button onClick={() => router.push(`/users/${userId}`)} style={{ marginLeft: "auto" }}>
          Mon profil
        </Button>
        <Button onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
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
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>
                      {msg.senderUsername}
                    </span>
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        backgroundColor: "#2e3138",
                        color: "#fff",
                        fontSize: "14px",
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
              >
                {stompConnected ? "Send" : "Connecting…"}
              </Button>
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
          {panelOpen && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-20px, -37px)",
              pointerEvents: "none", zIndex: 1,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="40" height="54">
                <path d="M12 0C7.589 0 4 3.589 4 8c0 5.698 7.199 13.518 7.502 13.855a.665.665 0 0 0 .996 0C12.801 21.518 20 13.698 20 8c0-4.411-3.589-8-8-8z" fill="#22c55e"/>
                <circle cx="12" cy="8" r="3.5" fill="white"/>
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

      {/* Event detail modal */}
      <Modal
        open={selectedEvent !== null}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        title={selectedEvent?.title}
        width={480}
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

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
                  <Button danger block>
                    Leave Event
                  </Button>
                )}
              </div>
            )}

            <div>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>Description</span>
              <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{selectedEvent.description ?? "—"}</p>
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
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

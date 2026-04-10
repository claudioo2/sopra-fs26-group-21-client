"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Drawer, Typography, Tag, Divider } from "antd";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Event } from "@/types/event";

// Fix Leaflet's default icon broken in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const { Text } = Typography;

function LocationCenter() {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
        () => map.setView([47.3769, 8.5417], 13), // fallback: Zurich
      );
    }
  }, [map]);
  return null;
}

interface EventWithParticipation extends Event {
  isParticipant?: boolean;
}

export default function MapClient() {
  const apiService = useApi();
  const [events, setEvents] = useState<EventWithParticipation[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const fetchEvents = async () => {
    try {
      const data = await apiService.get<Event[]>("/events");
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [apiService]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkerClick = (event: EventWithParticipation) => {
    // Check participation client-side: compare userId with participants via participantCount
    // We re-fetch the single event to get fresh data
    const fetchAndOpen = async () => {
      try {
        const fresh = await apiService.get<Event>(`/events/${event.id}`);
        // Determine participation: the backend doesn't return participant IDs in EventGetDTO,
        // so we store it via the join/leave actions. For now show the panel with current data.
        setSelectedEvent({ ...fresh });
        setDrawerOpen(true);
      } catch {
        setSelectedEvent(event);
        setDrawerOpen(true);
      }
    };
    fetchAndOpen();
  };

  const handleJoin = async () => {
    if (!selectedEvent || !token) return;
    setLoading(true);
    try {
      const updated = await apiService.post<Event>(
        `/events/${selectedEvent.id}/participants`,
        {},
      );
      setSelectedEvent({ ...updated, isParticipant: true });
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? { ...updated, isParticipant: true } : e)),
      );
    } catch (error) {
      if (error instanceof Error) alert(`Could not join event:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedEvent || !token) return;
    setLoading(true);
    try {
      const updated = await apiService.delete<Event>(
        `/events/${selectedEvent.id}/participants`,
      );
      setSelectedEvent({ ...updated, isParticipant: false });
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? { ...updated, isParticipant: false } : e)),
      );
    } catch (error) {
      if (error instanceof Error) alert(`Could not leave event:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  };

  const isCreator =
    selectedEvent != null && userId !== "" && String(selectedEvent.creatorId) === userId;

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <MapContainer
        center={[47.3769, 8.5417]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationCenter />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            eventHandlers={{ click: () => handleMarkerClick(event) }}
          >
            <Popup>{event.title}</Popup>
          </Marker>
        ))}
      </MapContainer>

      <Drawer
        title={selectedEvent?.title ?? "Event Details"}
        placement="right"
        size="default"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <Text type="secondary">Organizer</Text>
              <p style={{ margin: 0 }}>
                <strong>{selectedEvent.creatorUsername}</strong>
                {isCreator && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    You
                  </Tag>
                )}
              </p>
            </div>

            {selectedEvent.description && (
              <div>
                <Text type="secondary">Description</Text>
                <p style={{ margin: 0 }}>{selectedEvent.description}</p>
              </div>
            )}

            <div>
              <Text type="secondary">Start</Text>
              <p style={{ margin: 0 }}>{formatTime(selectedEvent.startTime)}</p>
            </div>

            {selectedEvent.endTime && (
              <div>
                <Text type="secondary">End</Text>
                <p style={{ margin: 0 }}>{formatTime(selectedEvent.endTime)}</p>
              </div>
            )}

            <div>
              <Text type="secondary">Participants</Text>
              <p style={{ margin: 0 }}>
                <strong>{selectedEvent.participantCount}</strong> joined
              </p>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            {token && !selectedEvent.isParticipant && !isCreator && (
              <Button type="primary" onClick={handleJoin} loading={loading} block>
                Join Event
              </Button>
            )}

            {token && (selectedEvent.isParticipant || isCreator) && (
              <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                <Button
                  type="primary"
                  onClick={() => window.location.href = `/chat/${selectedEvent.id}`}
                  block
                >
                  Join Chat
                </Button>
                {!isCreator && (
                  <Button danger onClick={handleLeave} loading={loading} block>
                    Leave Event
                  </Button>
                )}
              </div>
            )}

            {!token && (
              <Text type="secondary">Log in to join this event.</Text>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

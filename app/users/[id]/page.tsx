"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { EventDTO, EventCategory } from "@/types/event";
import { Button, Form, Input } from "antd";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

const CATEGORY_COLORS: Record<EventCategory, string> = {
  SPORTS: "#f97316", MUSIC: "#a855f7", FOOD: "#f43f5e", ART: "#ec4899",
  SOCIAL: "#3b82f6", OUTDOOR: "#22c55e", PARTY: "#eab308", OTHER: "#94a3b8",
};

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;
  const apiService = useApi();

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");

  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [form] = Form.useForm();
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = userId && profileId && String(userId) === String(profileId);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const fetched = await apiService.get<User>(`/users/${profileId}`, {
          Authorization: `Bearer ${token}`,
        });
        setUser(fetched);

        const fetchedEvents = await apiService.get<EventDTO[]>(`/users/${profileId}/events`, {
          Authorization: `Bearer ${token}`,
        });
        setEvents(fetchedEvents);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Could not load profile:\n${error.message}`);
        }
        router.push("/map");
      }
    };
    fetchData();
  }, [apiService, profileId, token, router, isMounted]);

  const handleEdit = () => {
    form.setFieldsValue({ username: user?.username, bio: user?.bio ?? "" });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const updated = await apiService.put<User>(`/users/${profileId}`, {
        username: values.username,
        bio: values.bio,
      });
      setUser(updated);
      setEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Could not update profile:\n${error.message}`);
      }
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";
  const isOnline = user?.status === "ONLINE";

  const handleLogout = () => {
    setIsMounted(false);
    clearToken();
    clearUserId();
    router.push("/login");
  };

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 40px" }}>

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", padding: "16px 0", gap: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push("/map")} style={{ color: "#fff", fontSize: 16 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 17 }}>{user?.username ?? "Profile"}</span>
          {!isOwnProfile && (
            <Button size="small" onClick={handleFollowToggle} style={{ backgroundColor: isFollowing ? "#1c1c1c" : "#3897f0", borderColor: isFollowing ? "#333" : "#3897f0", color: "#fff", borderRadius: 8, fontWeight: 600 }}>
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
        {isOwnProfile && !editing && (
          <Button type="text" icon={<EditOutlined />} onClick={handleEdit} style={{ color: "#fff", marginLeft: "auto" }} />
        )}
        {editing && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setEditing(false)} style={{ color: "#aaa" }} />
            <Button type="text" icon={<CheckOutlined />} onClick={handleSave} style={{ color: "#3897f0" }} />
          </div>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 86, height: 86, borderRadius: "50%", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
              {initials}
            </div>
            <div style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", backgroundColor: isOnline ? "#22c55e" : "#6b7280", border: "2px solid #0a0a0a" }} />
          </div>
          <span style={{ fontSize: 13, color: isOnline ? "#22c55e" : "#6b7280", fontWeight: 500 }}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Username + bio */}
        {!editing ? (
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px 0", color: "#fff", fontWeight: 600, fontSize: 15 }}>{user?.username}</p>
            <p style={{ margin: 0, color: user?.bio ? "#d1d5db" : "#6b7280", fontSize: 14, lineHeight: 1.5 }}>{user?.bio ?? "No bio yet."}</p>
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ marginBottom: 24 }}>
            <Form.Item name="username" rules={[{ required: true, message: "Username is required" }]} style={{ marginBottom: 12 }}>
              <Input placeholder="Username" style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff" }} />
            </Form.Item>
            <Form.Item name="bio" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="Write a bio…" style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", resize: "none" }} />
            </Form.Item>
          </Form>
        )}

        {isOwnProfile && (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button onClick={() => router.push(`/users/${profileId}/followers`)} style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", borderRadius: 8, fontWeight: 500 }}>
              View Followers
            </Button>
            <Button onClick={handleLogout} style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", borderRadius: 8, fontWeight: 500 }}>
              Logout
            </Button>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1f1f1f", marginBottom: 24, marginTop: 24 }} />

        {/* Events section */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: "0 0 12px 0" }}>
            Events joined ({events.length})
          </p>
          {events.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>No events joined yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}/board?title=${encodeURIComponent(event.title)}`)}
                  style={{ backgroundColor: "#16181D", borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, border: "1px solid #2e3138" }}
                >
                  {event.category && (
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: CATEGORY_COLORS[event.category], flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </p>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                      {new Date(event.startTime).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {event.isPrivate && (
                    <span style={{ fontSize: 11, color: "#6b7280", backgroundColor: "#23262d", padding: "2px 8px", borderRadius: 999 }}>Private</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to map */}
        <Button block onClick={() => router.push("/map")} style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", height: 40, borderRadius: 8 }}>
          Back to Map
        </Button>
      </div>
    </div>
  );
};

export default Profile;

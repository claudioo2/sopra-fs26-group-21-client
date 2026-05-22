"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { EventDTO, EventCategory } from "@/types/event";
import { App, ConfigProvider, Form, Input, Rate } from "antd";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined, KeyOutlined, CompassOutlined, UserOutlined } from "@ant-design/icons";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  SPORTS: "Sports", MUSIC: "Music", FOOD: "Food", ART: "Art",
  SOCIAL: "Social", OUTDOOR: "Outdoor", PARTY: "Party", OTHER: "Other",
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  SPORTS: "#f97316", MUSIC: "#a855f7", FOOD: "#f43f5e", ART: "#ec4899",
  SOCIAL: "#3b82f6", OUTDOOR: "#22c55e", PARTY: "#eab308", OTHER: "#94a3b8",
};

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

const AVATAR_GRADIENT = "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)";

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
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [leavingEvent, setLeavingEvent] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
  const [leaveEventModalOpen, setLeaveEventModalOpen] = useState(false);
  const { message: messageApi } = App.useApp();

  const isOwnProfile = userId && profileId && String(userId) === String(profileId);

  const isCreator = selectedEvent !== null && Number(userId) === selectedEvent.creatorId;

  useEffect(() => {
    if (!isMounted) { setIsMounted(true); return; }
    if (!token) { router.push("/login"); return; }
    const fetchData = async () => {
      try {
        const fetched = await apiService.get<User>(`/users/${profileId}`, { Authorization: `Bearer ${token}` });
        setUser(fetched);
        const fetchedEvents = await apiService.get<EventDTO[]>(`/users/${profileId}/events`, { Authorization: `Bearer ${token}` });
        setEvents(fetchedEvents);
        const fetchedFollowing = await apiService.get<User[]>(`/users/following`, { Authorization: `Bearer ${token}` });
        setFollowing(fetchedFollowing);
        if (fetchedFollowing.some((u) => String(u.id) === String(profileId))) {
          setIsFollowing(true);
        }
      } catch (error) {
        if (error instanceof Error) alert(`Could not load profile:\n${error.message}`);
        router.push("/map");
      }
    };
    fetchData();
  }, [apiService, profileId, token, router, isMounted]);

  const handleEdit = () => {
  form.setFieldsValue({
    username: user?.username,
    email: user?.email ?? "",
    password: "",
    bio: user?.bio ?? "",
  });

  setEditing(true);
};

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const updated = await apiService.put<User>(`/users/${profileId}`, {
        username: values.username,
        email: values.email,
        password: values.password || undefined,
        bio: values.bio,
      });
      setUser(updated);
      form.resetFields(["password", "confirmPassword"]);
      setEditing(false);
    } catch (error) {
      if (error instanceof Error) alert(`Could not update profile:\n${error.message}`);
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";
  const isOnline = user?.status === "ONLINE";
  console.log(user);

  const handleLogout = async () => {
    try {
      await apiService.put(`/users/${userId}`, {status: "OFFLINE"}, { Authorization: `Bearer ${token}` });
      setIsMounted(false);
      clearToken();
      clearUserId();
      messageApi.success("You are being logged out. See you next time!");
      router.push("/login");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Failed to logout");
    }
  };

  const handleFollowToggle = async () => {
    console.log(isFollowing ? "following" : "not followed");
    const message: string = isFollowing ? "Failed to follow." : "Failed to unfollow.";
    try {
      if (isFollowing) {
        await apiService.delete(`/users/${profileId}/follow`,
          { Authorization: `Bearer ${token}` });
        
        setIsFollowing((prev) => !prev);
        messageApi.success("You are not following " + user?.username + " anymore.");
      } else {
        await apiService.post(`/users/${profileId}/follow`,{},
          { Authorization: `Bearer ${token}` });

        setIsFollowing((prev) => !prev);
        messageApi.success("You are now following " + user?.username + "!");
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : message);
    }
  };

  const handleOpenFollowingModal = async () => {
    setFollowingModalOpen(true);
    setLoadingFollowing(true);

    try {
      const data = await apiService.get<User[]>(
        `/users/${profileId}/following`,
        { Authorization: `Bearer ${token}` }
      );

      setFollowing(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? `Could not load users you follow:\n${error.message}`
          : "Could not load users you follow."
      );
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleOpenFollowersModal = async () => {
    setFollowersModalOpen(true);
    setLoadingFollowers(true);

    try {
      const data = await apiService.get<User[]>(
        `/users/${profileId}/followers`,
        { Authorization: `Bearer ${token}` }
      );

      setFollowers(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? `Could not load followers:\n${error.message}`
          : "Could not load followers."
      );
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleDeleteEvent = async (selectedEvent: EventDTO | null) => {
    if (!selectedEvent) return;

    try {
      await apiService.delete(
        `/events/${selectedEvent.id}`,
        { Authorization: `Bearer ${token}` }
      );

      const eventId = selectedEvent.id;
      const cancelledAt = new Date().toISOString();

      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, cancelledAt } : e));
      setSelectedEvent((prev) => prev ? { ...prev, cancelledAt } : null);
      messageApi.success("Event cancelled.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete event";
      messageApi.error(msg);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoiningByCode(true);
    try {
      await apiService.post(`/events/participants`, { inviteCode: inviteCode.trim(), userId: Number(userId) }, { Authorization: `Bearer ${token}` });
      messageApi.success("You joined the event!");
      setInviteCode("");
      router.push("/map");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const msg = raw.includes("404") || raw.includes("not found")
        ? "Invalid invite code. Please check and try again."
        : raw.includes("409") || raw.includes("already")
        ? "You are already a participant of this event."
        : raw.includes("403") || raw.includes("ended")
        ? "This event has already ended — joining is no longer possible."
        : "Something went wrong. Please try again.";
      messageApi.error(msg);
    } finally {
      setJoiningByCode(false);
    }
  };

  const isUserParticipant = (event: EventDTO) => {
    return event.participantIds?.some(p => String(p) === String(userId));
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
        setEvents((prev) => prev.map((e) => e.id === updated.id ? { ...updated, isParticipant: true } : e));
        messageApi.success("You joined the event!");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to join event";
        messageApi.error(msg);
      } finally {
        setJoiningEvent(false);
      }
    };

  const handleLeaveEvent = async (event: EventDTO | null) => {
    if (!event) return;
    
    setLeavingEvent(true);
    try {
      await apiService.delete(`/events/${event.id}/participants/${userId}`, { Authorization: `Bearer ${token}` });
      if (Number(userId) === Number(profileId)) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      }
      setSelectedEvent(null);
      const updated = { ...event, isParticipant: false, participantIds: event.participantIds ? event.participantIds.filter(p => Number(p) !== Number(userId)) : null };
      setEvents((prev) => prev.map((e) => e.id === event.id ? updated : e));
      messageApi.success("You left the event.");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Failed to leave event");
    } finally {
      setLeavingEvent(false);
    }
  };

  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()} · ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundImage: `linear-gradient(180deg, #833ab4 0%, #fd1d1d22 10%, #0a0a0a 28%)`, backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 24px" }}>

        {/* Top bar */}
        <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", padding: "16px 0", gap: 12 }}>
          <button
            onClick={() => router.push("/map")}
            className="hover-button"
            style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <ArrowLeftOutlined />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{user?.username ?? "Profile"}</span>
          </div>
          {isOwnProfile && !editing && (
            <button onClick={handleEdit} className="hover-button" style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EditOutlined />
            </button>
          )}
          {editing && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(false)} className="hover-button" style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#aaa", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CloseOutlined />
              </button>
              <button onClick={handleSave} className="hover-button" style={{ background: "rgba(56,151,240,0.2)", border: "1.5px solid #3897f0", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#3897f0", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckOutlined />
              </button>
            </div>
          )}
        </div>

        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Avatar + info row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 86, height: 86, borderRadius: "50%", background: AVATAR_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: 1, boxShadow: "0 4px 20px rgba(131,58,180,0.4)" }}>
                {initials}
              </div>
              <div style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", backgroundColor: isOnline ? "#22c55e" : "#6b7280", border: "2px solid #0a0a0a" }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isOnline ? "#22c55e" : "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>
                  {isOnline ? "● Online" : "○ Offline"}
                </span>
              </div>
              <p style={{ margin: "0 0 2px 0", color: "#fff", fontWeight: 700, fontSize: 18 }}>{user?.username}</p>
            </div>
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                className="hover-button"
                style={{ padding: "5px 12px", borderRadius: 999, border: `1.5px solid ${isFollowing ? "#3a3f4a" : "#833ab4"}`, backgroundColor: isFollowing ? "transparent" : "#833ab4", color: isFollowing ? "#9ca3af" : "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {user?.ratingCount != null && user.ratingCount > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ConfigProvider theme={{ components: { Rate: { starColor: "#fbbf24", starBg: "#4b5563" } } }}>
                <Rate disabled allowHalf value={user.averageRating ?? 0} style={{ fontSize: 16 }} />
              </ConfigProvider>
              <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500 }}>
                {user.ratingCount} review{user.ratingCount === 1 ? "" : "s"}
              </span>
            </div>
          )}

          {/* Bio / edit form */}
          <p style={{
              margin: "0 0 20px 0",
              color: user?.bio ? "#d1d5db" : "#4b5563",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {user?.bio ?? "No bio yet."}
          </p>

          {/* Action buttons */}
          {isOwnProfile && (
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              <button
                onClick={handleOpenFollowingModal}
                className="hover-button"
                style={{ flex: 1, minWidth: 80, height: 38, borderRadius: 999, border: "1.5px solid #2e3138", backgroundColor: "#16181D", color: "#d1d5db", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Following
              </button>
              <button
                onClick={handleOpenFollowersModal}
                className="hover-button"
                style={{ flex: 1, minWidth: 80, height: 38, borderRadius: 999, border: "1.5px solid #2e3138", backgroundColor: "#16181D", color: "#d1d5db", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Followers
              </button>
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="hover-button"
                style={{ flex: 1, minWidth: 80, height: 38, borderRadius: 999, border: "1.5px solid #2e3138", backgroundColor: "#16181D", color: "#f87171", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Logout
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid #1f1f1f", marginBottom: 24 }} />

          {/* Join with invite code */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#9ca3af", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px 0" }}>Join with invite code</p>
            <form onSubmit={handleJoinByCode} style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <KeyOutlined style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 13, pointerEvents: "none" }} />
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  style={{ width: "100%", padding: "0 14px 0 34px", height: 42, borderRadius: 999, border: "1.5px solid #2e3138", backgroundColor: "#16181D", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                className="hover-button"
                disabled={joiningByCode || !inviteCode.trim()}
                style={{ height: 42, borderRadius: 999, border: "none", backgroundColor: "#833ab4", color: "#fff", fontSize: 13, fontWeight: 700, padding: "0 18px", cursor: "pointer", opacity: (!inviteCode.trim() || joiningByCode) ? 0.5 : 1, flexShrink: 0 }}
              >
                {joiningByCode ? "…" : "Join"}
              </button>
            </form>
          </div>

          {/* Events section */}
          {(() => {
            const now = new Date();
            const upcomingEvents = events.filter(e => !e.cancelledAt && new Date(e.endTime) >= now);
            const pastEvents = events.filter(e => e.cancelledAt || new Date(e.endTime) < now);

            const renderEventCard = (event: EventDTO) => {
              const catColor = event.category ? CATEGORY_COLORS[event.category] : "#94a3b8";
              const isPast = !event.cancelledAt && new Date(event.endTime) < now;
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  style={{ backgroundColor: "#16181D", borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, border: "1px solid #2e3138", transition: "border-color 0.15s", opacity: isPast || event.cancelledAt ? 0.6 : 1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = catColor + "66")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2e3138")}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: catColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {event.category && (
                      <svg viewBox="0 0 24 24" width="18" height="18" dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[event.category] }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </p>
                    <p style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: 12 }}>
                      {new Date(event.startTime).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                      {event.category && <span style={{ color: catColor, marginLeft: 6, fontWeight: 500 }}>{CATEGORY_LABELS[event.category]}</span>}
                    </p>
                  </div>
                  {event.cancelledAt && (
                    <span style={{ fontSize: 10, color: "#ef4444", backgroundColor: "#2d1515", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>Cancelled</span>
                  )}
                  {isPast && (
                    <span style={{ fontSize: 10, color: "#6b7280", backgroundColor: "#23262d", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>Ended</span>
                  )}
                  {event.isPrivate && !event.cancelledAt && !isPast && (
                    <span style={{ fontSize: 10, color: "#6b7280", backgroundColor: "#23262d", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>Private</span>
                  )}
                </div>
              );
            };

            return (
              <>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: "#9ca3af", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 0" }}>
                    Events · {upcomingEvents.length}
                  </p>
                  {upcomingEvents.length === 0 ? (
                    <p style={{ color: "#4b5563", fontSize: 14, textAlign: "center", marginTop: 20 }}>No upcoming events.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {upcomingEvents.map(renderEventCard)}
                    </div>
                  )}
                </div>

                {pastEvents.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ color: "#9ca3af", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 0" }}>
                      Past Events · {pastEvents.length}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {pastEvents.map(renderEventCard)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        </div>
      </div>{/* end scrollable */}

      {/* Bottom navigation */}
      <div style={{ position: "relative", height: 72, paddingBottom: 8, backgroundColor: "#16181D", borderTop: "1px solid #2a2d35", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/map")}
          className="hover-button"
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 }}
        >
          <CompassOutlined style={{ fontSize: 22, color: "#6b7280" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Explore</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "transparent" }} />
        </button>

        {/* Drop a pin — centrato, porta alla mappa */}
        <button
          onClick={() => router.push("/map")}
          className="hover-button"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #833ab4, #6a2d93)",
            border: "none",
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
            boxShadow: "0 4px 24px rgba(131,58,180,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="26" height="33" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="profile-pin-grad" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#833ab4"/>
                <stop offset="50%" stopColor="#fd1d1d"/>
                <stop offset="100%" stopColor="#fcb045"/>
              </linearGradient>
            </defs>
            <path d="M14 1 C7 1 1 6.5 1 13 C1 20.5 14 35 14 35 C14 35 27 20.5 27 13 C27 6.5 21 1 14 1 Z" fill="url(#profile-pin-grad)"/>
            <circle cx="14" cy="12.5" r="5.5" fill="rgba(0,0,0,0.35)"/>
            <path d="M15.5 7 L11 13.5 L14 13.5 L12.5 18.5 L17 12 L14 12 Z" fill="white"/>
          </svg>
          Explore
        </button>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        <button
          onClick={() => router.push(`/users/${profileId}`)}
          className="hover-button"
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 }}
        >
          <UserOutlined style={{ fontSize: 22, color: "#fff" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Profile</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#833ab4" }} />
        </button>
      </div>

      {/* Event detail overlay */}
      {selectedEvent && (() => {
        const catColor = selectedEvent.category ? CATEGORY_COLORS[selectedEvent.category] : "#75bd9d";
        const catIcon = selectedEvent.category ? CATEGORY_ICONS[selectedEvent.category] : CATEGORY_ICONS.OTHER;
        const isCreator = Number(userId) === selectedEvent.creatorId;
        const card = { backgroundColor: "#23262d", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.25)" };
        const label = { color: "#6b7280", fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 };
        const value = { margin: "5px 0 0 0", color: "#f3f4f6", fontWeight: 600, fontSize: 15 };
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={() => setSelectedEvent(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: 400, maxWidth: "calc(100vw - 32px)", maxHeight: "88vh", overflowY: "auto", borderRadius: 24, boxShadow: "0 12px 48px rgba(0,0,0,0.5)", background: `linear-gradient(180deg, ${catColor} 0%, ${catColor}99 18%, ${catColor}33 40%, #16181D 62%)` }}
            >
              <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                  <p style={{ ...value, fontWeight: 400, fontSize: 14, lineHeight: 1.6, color: "#d1d5db" }}>{selectedEvent.description ?? "No description."}</p>
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

                {/* Dates */}
                <div style={card}>
                  <span style={label}>Start</span>
                  <p style={{ ...value, marginBottom: 12 }}>{fmt(selectedEvent.startTime)}</p>
                  <div style={{ height: 1, backgroundColor: "#2e3138", margin: "0 0 12px" }} />
                  <span style={label}>End</span>
                  <p style={{ ...value, marginBottom: 0 }}>{fmt(selectedEvent.endTime)}</p>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {!isCreator && !isUserParticipant(selectedEvent) && (
                  new Date(selectedEvent.endTime) < new Date() ? (
                    <div style={{ width: "100%", padding: "12px 16px", borderRadius: 12, backgroundColor: "#23262d", border: "1.5px solid #3a3f4a", color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
                      This event has ended — joining is no longer possible.
                    </div>
                  ) : (
                    <button onClick={handleJoinEvent} disabled={joiningEvent} className="hover-button"
                      style={{ width: "100%", height: 48, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                      {joiningEvent ? "Joining…" : "Join Event"}
                    </button>
                  )
                )}
                {(selectedEvent.isParticipant || isCreator || isUserParticipant(selectedEvent)) && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/map?openChat=${selectedEvent.id}`)}
                      className="hover-button"
                      style={{ flex: 1, height: 48, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                    >
                      Join Chat
                    </button>
                    {!isCreator && (
                      <button
                        onClick={() => setLeaveEventModalOpen(true)}
                        disabled={leavingEvent}
                        className="hover-button"
                        style={{ flex: 1, height: 48, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "#23262d", color: "#f87171", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: leavingEvent ? 0.6 : 1 }}
                      >
                        {leavingEvent ? "Leaving…" : "Leave"}
                      </button>
                    )}
                  </div>
                  )}
                  <button
                    onClick={() => router.push(`/events/${selectedEvent.id}/board?title=${encodeURIComponent(selectedEvent.title)}`)}
                    className="hover-button"
                    style={{ width: "100%", height: 48, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "#23262d", color: "#f3f4f6", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
                  >
                    View Board
                  </button>
                  {isCreator && !selectedEvent.cancelledAt && (
                    <button
                      onClick={() => setDeleteEventModalOpen(true)}
                      className="hover-button"
                      style={{ width: "100%", height: 44, borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "transparent", color: "#f87171", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
                    >
                      Delete Event
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Following overlay */}
      {followingModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setFollowingModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: "75vh", display: "flex", flexDirection: "column", borderRadius: 24, backgroundColor: "#16181D", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", overflow: "hidden" }}
          >
            <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #2e3138", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Following</span>
              <button onClick={() => setFollowingModalOpen(false)} className="hover-button" style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#aaa", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {loadingFollowing ? (
                <p style={{ color: "#6b7280", textAlign: "center", marginTop: 24 }}>Loading…</p>
              ) : following.length === 0 ? (
                <p style={{ color: "#4b5563", textAlign: "center", marginTop: 24 }}>Not following anyone yet.</p>
              ) : following.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, backgroundColor: "#23262d" }}>
                  <div>
                    <p style={{ margin: 0, color: "#f3f4f6", fontWeight: 600, fontSize: 14 }}>{u.username ?? `User ${u.id}`}</p>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{u.status ?? "Offline"}</p>
                  </div>
                  <button
                    onClick={() => { setFollowingModalOpen(false); router.push(`/users/${u.id}`); }}
                    className="hover-button"
                    style={{ padding: "4px 14px", borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "transparent", color: "#d1d5db", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >View</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Followers overlay */}
      {followersModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setFollowersModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: "75vh", display: "flex", flexDirection: "column", borderRadius: 24, backgroundColor: "#16181D", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", overflow: "hidden" }}
          >
            <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #2e3138", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Followers</span>
              <button onClick={() => setFollowersModalOpen(false)} className="hover-button" style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#aaa", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {loadingFollowers ? (
                <p style={{ color: "#6b7280", textAlign: "center", marginTop: 24 }}>Loading…</p>
              ) : followers.length === 0 ? (
                <p style={{ color: "#4b5563", textAlign: "center", marginTop: 24 }}>No followers yet.</p>
              ) : followers.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, backgroundColor: "#23262d" }}>
                  <div>
                    <p style={{ margin: 0, color: "#f3f4f6", fontWeight: 600, fontSize: 14 }}>{u.username ?? `User ${u.id}`}</p>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{u.status ?? "Offline"}</p>
                  </div>
                  <button
                    onClick={() => { setFollowersModalOpen(false); router.push(`/users/${u.id}`); }}
                    className="hover-button"
                    style={{ padding: "4px 14px", borderRadius: 999, border: "1.5px solid #3a3f4a", backgroundColor: "transparent", color: "#d1d5db", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >View</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The modal for editing profile */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => {
            form.resetFields(["password", "confirmPassword"]);
            setEditing(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: "calc(100vw - 32px)",
              borderRadius: 24,
              backgroundColor: "#16181D",
              padding: 24,
              boxShadow: "0 12px 48px rgba(0,0,0,0.55)",
              border: "1px solid #2e3138",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                Edit Profile
              </h2>

              <button
                onClick={() => setEditing(false)}
                className="hover-button"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  cursor: "pointer",
                  color: "#aaa",
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
            >
              {/* USERNAME */}
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>Username</span>}
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Please input your username!",
                  },
                  {
                    min: 3,
                    message: "Username must be at least 3 characters.",
                  },
                ]}
              >
                <Input
                  placeholder="Enter username"
                  style={{
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    color: "#fff",
                    borderRadius: 10,
                    height: 42,
                  }}
                />
              </Form.Item>

              {/* EMAIL */}
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>Email</span>}
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please input your email!",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email address.",
                  },
                ]}
              >
                <Input
                  placeholder="you@example.com"
                  style={{
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    color: "#fff",
                    borderRadius: 10,
                    height: 42,
                  }}
                />
              </Form.Item>

              {/* NEW PASSWORD */}
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>New Password</span>}
                name="password"
                rules={[
                  {
                    min: 6,
                    message: "Password must be at least 6 characters.",
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  placeholder="Enter new password"
                  style={{
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    color: "#fff",
                    borderRadius: 10,
                    height: 42,
                  }}
                />
              </Form.Item>

              {/* CONFIRM PASSWORD */}
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>Verify Password</span>}
                name="confirmPassword"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue("password") && !value) {
                        return Promise.resolve();
                      }

                      if (getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("Passwords do not match.")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Verify new password"
                  style={{
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    color: "#fff",
                    borderRadius: 10,
                    height: 42,
                  }}
                />
              </Form.Item>

              {/* BIO */}
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>Bio</span>}
                name="bio"
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Write your bio..."
                  style={{
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    color: "#fff",
                    resize: "none",
                    borderRadius: 10,
                  }}
                />
              </Form.Item>

              {/* BUTTONS */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => {
                    form.resetFields(["password", "confirmPassword"]);
                    setEditing(false);
                  }}
                  className="hover-button"
                  type="button"
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid #3a3f4a",
                    background: "transparent",
                    color: "#aaa",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="hover-button"
                  type="button"
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "none",
                    background:
                      "linear-gradient(135deg, #833ab4, #fd1d1d)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Logout confirmation */}
      {logoutModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)"}}
          onClick={() => setLogoutModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, maxWidth: "calc(100vw - 32px)", borderRadius: 24, backgroundColor: "#16181D", padding: 24, boxShadow: "0 12px 48px rgba(0,0,0,0.55)", border: "1px solid #2e3138"}}
          >
            <h2 style={{ color: "#fff", marginTop: 0, marginBottom: 12 }}>
              Logout?
            </h2>

            <p style={{ color: "#9ca3af", marginBottom: 24}}>
              Are you sure you want to log out?
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="hover-button"
                style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid #3a3f4a", background: "transparent", color: "#aaa", cursor: "pointer" }}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setLogoutModalOpen(false);
                  await handleLogout();
                }}
                className="hover-button"
                style={{ flex: 1, height: 44, borderRadius: 999, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 700}}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteEventModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
          onClick={() => setDeleteEventModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 360, backgroundColor: "#16181D", borderRadius: 18, padding: 20, border: "1px solid #2e3138" }}
          >
            <h3 style={{ color: "#fff", marginTop: 0 }}>
              Delete this event?
            </h3>

            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setDeleteEventModalOpen(false)}
                className="hover-button"
                style={{ flex: 1, height: 42, borderRadius: 999, border: "1px solid #3a3f4a", backgroundColor: "transparent", color: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleDeleteEvent(selectedEvent);
                  setDeleteEventModalOpen(false);
                }}
                className="hover-button"
                style={{ flex: 1, height: 42, borderRadius: 999, border: "none", backgroundColor: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {leaveEventModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
          onClick={() => setLeaveEventModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 360, backgroundColor: "#16181D", borderRadius: 18, padding: 20, border: "1px solid #2e3138" }}
          >
            <h3 style={{ color: "#fff", marginTop: 0 }}>
              Leave this event?
            </h3>

            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Are you sure you want to leave?
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setLeaveEventModalOpen(false)}
                className="hover-button"
                style={{ flex: 1, height: 42, borderRadius: 999, border: "1px solid #3a3f4a", backgroundColor: "transparent", color: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleLeaveEvent(selectedEvent);
                  setLeaveEventModalOpen(false);
                }}
                className="hover-button"
                style={{ flex: 1, height: 42, borderRadius: 999, border: "none", backgroundColor: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

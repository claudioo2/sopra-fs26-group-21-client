"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { EventDTO, EventCategory } from "@/types/event";
import { App, Button, Form, Input, Modal } from "antd";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined, KeyOutlined, CompassOutlined, UserOutlined } from "@ant-design/icons";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  SPORTS: "Sports", MUSIC: "Music", FOOD: "Food", ART: "Art",
  SOCIAL: "Social", OUTDOOR: "Outdoor", PARTY: "Party", OTHER: "Other",
};

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
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);
  const { message: messageApi } = App.useApp();

  const isOwnProfile = userId && profileId && String(userId) === String(profileId);

  const isCreator = selectedEvent !== null && Number(userId) === selectedEvent.creatorId;

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

    const confirmed = window.confirm("Are you sure you want to delete this event?");
    if (!confirmed) return;

    try {
      await apiService.delete(
        `/events/${selectedEvent.id}`,
        { Authorization: `Bearer ${token}` }
      );

      const eventId = selectedEvent.id;

      setSelectedEvent(null);

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      messageApi.success("Event deleted.");
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
        : "Something went wrong. Please try again.";
      messageApi.error(msg);
    } finally {
      setJoiningByCode(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" }}>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 24px" }}>

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
            <Button
              onClick={handleOpenFollowingModal}
              style={{
                backgroundColor: "#1c1c1c",
                borderColor: "#333",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              View users you follow
            </Button>

            <Button
              onClick={handleOpenFollowersModal}
              style={{
                backgroundColor: "#1c1c1c",
                borderColor: "#333",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              View Followers
            </Button>


            <Button 
              onClick={handleLogout} 
              style={{ 
                backgroundColor: "#1c1c1c", 
                borderColor: "#333", 
                color: "#fff", 
                borderRadius: 8, 
                fontWeight: 500 
              }}>
              Logout
            </Button>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1f1f1f", marginBottom: 24, marginTop: 24 }} />

        {/* Join with code */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: "0 0 10px 0" }}>Join with invite code</p>
          <form onSubmit={handleJoinByCode} style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <KeyOutlined style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: 14, pointerEvents: "none" }} />
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                style={{ width: "100%", padding: "0 12px 0 30px", height: 38, borderRadius: 8, border: "1px solid #333", backgroundColor: "#1c1c1c", color: "#fff", fontSize: 14, outline: "none" }}
              />
            </div>
            <Button htmlType="submit" loading={joiningByCode} style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", borderRadius: 8 }}>
              Join
            </Button>
          </form>
        </div>

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
                  onClick={() => setSelectedEvent(event)}
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

      </div>
      {/* Following modal */}
      <Modal
        open={followingModalOpen}
        onCancel={() => setFollowingModalOpen(false)}
        footer={null}
        title={<span style={{ color: "#111827" }}>Followers</span>}
        width={420}
      >
        {loadingFollowing ? (
          <p style={{ color: "#6b7280" }}>Loading users you follow...</p>
        ) : following.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>You don&apos;t follow anyone yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {following.map((followedUser) => (
              <div
                key={followedUser.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "#f3f4f6",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#111827", fontWeight: 600 }}>
                    {followedUser.username ?? `User ${followedUser.id}`}
                  </p>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
                    {followedUser.status ?? "Offline"}
                  </p>
                </div>

                <Button
                  size="small"
                  onClick={() => {
                    setFollowingModalOpen(false);
                    router.push(`/users/${followedUser.id}`);
                  }}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>


      <Modal
        open={followersModalOpen}
        onCancel={() => setFollowersModalOpen(false)}
        footer={null}
        title={<span style={{ color: "#111827" }}>Followers</span>}
        width={420}
      >
        {loadingFollowers ? (
          <p style={{ color: "#6b7280" }}>Loading followers...</p>
        ) : followers.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No followers yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {followers.map((follower) => (
              <div
                key={follower.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "#f3f4f6",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#111827", fontWeight: 600 }}>
                    {follower.username ?? `User ${follower.id}`}
                  </p>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
                    {follower.status ?? "Offline"}
                  </p>
                </div>

                <Button
                  size="small"
                  onClick={() => {
                    setFollowersModalOpen(false);
                    router.push(`/users/${follower.id}`);
                  }}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>


      {/* Event detail modal */}
      </div>{/* end scrollable content */}

      {/* Bottom navigation */}
      <div style={{ height: 64, paddingBottom: 12, backgroundColor: "#16181D", borderTop: "1px solid #2a2d35", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/map")}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "#888", fontSize: 11, fontWeight: 500 }}
        >
          <CompassOutlined style={{ fontSize: 22 }} />
          <span>Explore</span>
        </button>
        <button
          onClick={() => router.push(`/users/${profileId}`)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "#75bd9d", fontSize: 11, fontWeight: 500 }}
        >
          <UserOutlined style={{ fontSize: 22 }} />
          <span>Profile</span>
        </button>
      </div>

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
                <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", backgroundColor: CATEGORY_COLORS[selectedEvent.category], color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                  {CATEGORY_LABELS[selectedEvent.category]}
                </span>
              </div>
            )}
            <div>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>Description</span>
              <p style={{ margin: "2px 0 0 0", color: "#111827" }}>{selectedEvent.description ?? "—"}</p>
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
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="primary" block onClick={() => router.push(`/map?openChat=${selectedEvent.id}`)}>
                Join Chat
              </Button>
              {!isCreator && (
                <Button danger block onClick={async () => {
                  try {
                    await apiService.delete(`/events/${selectedEvent.id}/participants/${userId}`, { Authorization: `Bearer ${token}` });
                    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
                    setSelectedEvent(null);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : "Failed to leave event");
                  }
                }}>
                  Leave Event
                </Button>
              )}
            </div>
            <Button block onClick={() => router.push(`/events/${selectedEvent.id}/board?title=${encodeURIComponent(selectedEvent.title)}`)}>
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
    </div>
  );
};

export default Profile;

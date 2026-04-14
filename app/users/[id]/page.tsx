"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;
  const apiService = useApi();

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [form] = Form.useForm();

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
    const fetchUser = async () => {
      try {
        const fetched = await apiService.get<User>(`/users/${profileId}`, {
          Authorization: `Bearer ${token}`,
        });
        setUser(fetched);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Could not load profile:\n${error.message}`);
        }
        router.push("/map");
      }
    };
    fetchUser();
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

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const isOnline = user?.status === "ONLINE";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 16px 40px",
    }}>

      {/* Top bar */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        alignItems: "center",
        padding: "16px 0",
        gap: 12,
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/map")}
          style={{ color: "#fff", fontSize: 16 }}
        />
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 17 }}>
          {user?.username ?? "Profile"}
        </span>
        {isOwnProfile && !editing && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={{ color: "#fff", marginLeft: "auto" }}
          />
        )}
        {editing && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setEditing(false)}
              style={{ color: "#aaa" }}
            />
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={handleSave}
              style={{ color: "#3897f0" }}
            />
          </div>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Avatar + stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 20 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: 1,
            }}>
              {initials}
            </div>
            {/* Online dot */}
            <div style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: isOnline ? "#22c55e" : "#6b7280",
              border: "2px solid #0a0a0a",
            }} />
          </div>

          {/* Status label */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{
              fontSize: 13,
              color: isOnline ? "#22c55e" : "#6b7280",
              fontWeight: 500,
            }}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Username + bio */}
        {!editing ? (
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px 0", color: "#fff", fontWeight: 600, fontSize: 15 }}>
              {user?.username}
            </p>
            <p style={{ margin: 0, color: user?.bio ? "#d1d5db" : "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
              {user?.bio ?? "No bio yet."}
            </p>
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ marginBottom: 24 }}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input
                placeholder="Username"
                style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff" }}
              />
            </Form.Item>
            <Form.Item name="bio" style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={3}
                placeholder="Write a bio…"
                style={{ backgroundColor: "#1c1c1c", borderColor: "#333", color: "#fff", resize: "none" }}
              />
            </Form.Item>
          </Form>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1f1f1f", marginBottom: 24 }} />

        {/* Back to map */}
        <Button
          block
          onClick={() => router.push("/map")}
          style={{
            backgroundColor: "#1c1c1c",
            borderColor: "#333",
            color: "#fff",
            height: 40,
            borderRadius: 8,
          }}
        >
          Back to Map
        </Button>
      </div>
    </div>
  );
};

export default Profile;

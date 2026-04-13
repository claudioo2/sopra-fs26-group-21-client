"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input, Typography } from "antd";

const { Title, Text } = Typography;

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
        router.push("/users");
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

  if (!user) {
    return (
      <div className="card-container">
        <Card loading className="dashboard-container" />
      </div>
    );
  }

  return (
    <div className="card-container">
      <Card
        title="User Profile"
        className="dashboard-container"
        extra={
          <Button onClick={() => router.push("/users")}>Back</Button>
        }
      >
        {editing ? (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Bio" name="bio">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleSave} style={{ marginRight: 8 }}>
                Save
              </Button>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
            </Form.Item>
          </Form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text type="secondary">Username</Text>
              <Title level={4} style={{ margin: 0 }}>{user.username}</Title>
            </div>
            <div>
              <Text type="secondary">Status</Text>
              <div>{user.status ?? "—"}</div>
            </div>
            <div>
              <Text type="secondary">Bio</Text>
              <div>{user.bio ?? "—"}</div>
            </div>
            {isOwnProfile && (
              <Button type="primary" onClick={handleEdit} style={{ alignSelf: "flex-start" }}>
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Profile;

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input, Typography } from "antd";

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const { value: currentUserId } = useLocalStorage<string>("userId", "");

  const isOwnProfile = currentUserId === String(id);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await apiService.get<User>(`/users/${id}`);
        setUser(fetchedUser);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Failed to load profile:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchUser();
  }, [apiService, id]);

  const handleEdit = () => {
    form.setFieldsValue({ username: user?.username, bio: user?.bio ?? "" });
    setIsEditing(true);
  };

  const handleSave = async (values: { username: string; bio: string }) => {
    try {
      const updatedUser = await apiService.put<User>(`/users/${id}`, values);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to update profile:\n${error.message}`);
      } else {
        console.error("An unknown error occurred while updating the profile.");
      }
    }
  };

  return (
    <div className="card-container">
      <Card
        title="User Profile"
        loading={!user}
        className="dashboard-container"
        extra={
          <Button onClick={() => router.back()} type="default">
            Back
          </Button>
        }
      >
        {user && !isEditing && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <Text type="secondary">Username</Text>
              <Title level={4} style={{ margin: 0 }}>
                {user.username}
              </Title>
            </div>
            <div>
              <Text type="secondary">Bio</Text>
              <p style={{ margin: 0 }}>{user.bio ?? "No bio yet."}</p>
            </div>
            {isOwnProfile && (
              <Button type="primary" onClick={handleEdit} style={{ width: "fit-content" }}>
                Edit Profile
              </Button>
            )}
          </div>
        )}

        {user && isEditing && (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username cannot be empty" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="bio" label="Bio">
              <Input.TextArea rows={4} placeholder="Tell others about yourself..." />
            </Form.Item>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default Profile;

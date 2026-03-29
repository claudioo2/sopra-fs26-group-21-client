"use client";

import { useState } from "react";
import { Button, ConfigProvider, Form, Input, DatePicker, TimePicker, Segmented } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons"

interface EventFormValues {
  title: string;
  date: string;
  time: string;
  description: string;
  privacy: "public" | "private";
}

export default function MapPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = (values: EventFormValues) => {
    console.log("New event:", values);
    form.resetFields();
    setPanelOpen(false);
  };

  return (
    <main style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>Map</h1>
        <Button type="primary" onClick={() => setPanelOpen(true)}>
          + Create Event
        </Button>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        {/* Map placeholder — will be replaced when US1-Map-Integration is merged */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Map coming soon
        </div>

        {/* Side panel */}
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
                <ConfigProvider theme={{ token: { colorBgContainer: "#16181D", colorText: "#fff", colorTextPlaceholder: "#888888", colorBgElevated: "#16181D", colorIcon: "#fff", colorIconHover: "#aaa", colorTextHeading: "#fff", colorTextDisabled: "#555" } }}>
                  <DatePicker style={{ width: "100%" }} />
                </ConfigProvider>
              </Form.Item>

              <Form.Item
                label="Time"
                name="time"
                rules={[{ required: true, message: "Time is required" }]}
              >
                <ConfigProvider theme={{ token: { colorBgContainer: "#16181D", colorText: "#fff", colorTextPlaceholder: "#888888", colorBgElevated: "#16181D", colorIcon: "#fff", colorIconHover: "#aaa", colorTextHeading: "#fff", colorTextDisabled: "#555" } }}>
                  <TimePicker style={{ width: "100%" }} format="HH:mm" />
                </ConfigProvider>
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: "Description is required" }]}
              >
                <Input.TextArea placeholder="Brief description" rows={3} />
              </Form.Item>

              <Form.Item label="Privacy" name="privacy" initialValue="private">
                <ConfigProvider theme={{
                  components: {
                    Segmented: {
                      trackBg: "#fff",
                      itemSelectedBg: "#000",
                      itemSelectedColor: "#fff",
                      itemColor: "#000",
                      itemHoverColor: "#000",
                      motionDurationSlow: ".15s", // made the duration a little shorter than default to feel more snappy
                      controlHeight: 40,
                    }
                  }
                }}>
                  <Segmented
                    style={{ caretColor: "transparent" }} // made the carret invisible, because it looked bad
                    options={[
                      { label: <span><LockOutlined /> Private</span>, value: "private" },
                      { label: <span><GlobalOutlined /> Public</span>, value: "public" },
                    ]}
                    block
                  />
                </ConfigProvider>

              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block>
                  Create
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </main>
  );
}

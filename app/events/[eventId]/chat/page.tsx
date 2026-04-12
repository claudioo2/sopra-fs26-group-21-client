"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, App } from "antd";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { EventDTO } from "@/types/event";

interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const apiService = useApi();
  const { message: messageApi } = App.useApp();

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [isMounted, setIsMounted] = useState(false);

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
    if (!token) {
      router.push("/login");
    }
  }, [isMounted, token, router]);

  // Load event details
  useEffect(() => {
    if (!isMounted || !token || !eventId) return;
    apiService
      .get<EventDTO>(`/events/${eventId}`, { Authorization: `Bearer ${token}` })
      .then(setEvent)
      .catch(() => messageApi.error("Could not load event details."));
  }, [isMounted, token, eventId, apiService, messageApi]);

  // Load messages and poll every 3 seconds
  useEffect(() => {
    if (!isMounted || !token || !eventId) return;

    const fetchMessages = async () => {
      try {
        const data = await apiService.get<Message[]>(
          `/events/${eventId}/messages`,
          { Authorization: `Bearer ${token}` }
        );
        setMessages(data);
      } catch {
        // silently ignore polling errors
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isMounted, token, eventId, apiService]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    try {
      await apiService.post<Message>(
        `/events/${eventId}/messages`,
        { content: text },
        { Authorization: `Bearer ${token}` }
      );
      setInputText("");
    } catch {
      messageApi.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!token) return null;

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#16181D",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #2e3138",
          flexShrink: 0,
        }}
      >
        <Button type="text" onClick={() => router.push("/map")} style={{ color: "#aaa" }}>
          ← Back to Map
        </Button>
        <h2 style={{ margin: 0, fontSize: "16px" }}>
          {event ? event.title : "Event Chat"}
        </h2>
        {event && (
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            {event.participantCount} participant{event.participantCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#6b7280", textAlign: "center", marginTop: "32px" }}>
            No messages yet. Be the first to say something!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === Number(userId);
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}
            >
              {!isOwn && (
                <span style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>
                  {msg.senderUsername}
                </span>
              )}
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  backgroundColor: isOwn ? "#22426b" : "#2e3138",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                {msg.content}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
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
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleSend}
          style={{ backgroundColor: "#23262d", borderColor: "#444", color: "#fff" }}
        />
        <Button type="primary" onClick={handleSend} loading={sending} disabled={!inputText.trim()}>
          Send
        </Button>
      </div>
    </main>
  );
}

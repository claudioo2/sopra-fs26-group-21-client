"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, ConfigProvider } from "antd";

interface FormFieldProps {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { router.prefetch("/map"); }, [router]);
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const handleRegister = async (values: FormFieldProps) => {
    setLoading(true);
    setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 4000);
    try {
      const { username, email, password } = values;
      const response = await apiService.post<User>("/users", { username, email, password });
      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);
      router.push("/map");
    } catch (error) {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setLoading(false);
      setSlowHint(false);
      if (error instanceof Error) {
        let msg = "Registration failed. Please try again.";
        try {
          const jsonMatch = error.message.match(/\(\d+: ([\s\S]+)\)$/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            const detail: string = parsed.detail ?? parsed.message ?? "";
            if (detail.toLowerCase().includes("already exists")) {
              msg = "An account with this username and email already exists. Please log in instead.";
            } else if (detail.toLowerCase().includes("username")) {
              msg = "This username is already taken. Please choose another one.";
            } else if (detail.toLowerCase().includes("email")) {
              msg = "This email is already in use. Please use a different one.";
            }
          }
        } catch { /* keep generic message */ }
        alert(msg);
      }
    }
  };

  const mapBg = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/8.5417,47.3769,11/1280x800?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          backgroundColor: "rgba(10,10,10,0.93)",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
          overflow: "hidden",
        }}>
          <style>{`
            @keyframes pin-pulse {
              0%, 100% { transform: scale(1) translateY(0); }
              50% { transform: scale(1.12) translateY(-6px); }
            }
            @keyframes pin-float {
              0%   { transform: translateY(0) rotate(-8deg); opacity: 0; }
              8%   { opacity: 1; }
              92%  { opacity: 0.5; }
              100% { transform: translateY(-110vh) rotate(8deg); opacity: 0; }
            }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes glow-pulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.15); }
            }
          `}</style>

          {([
            { left: "6%",  delay: "0s",   dur: "7s",   w: 24, h: 31, color: "#f97316" },
            { left: "18%", delay: "1.4s", dur: "8.5s", w: 18, h: 23, color: "#a855f7" },
            { left: "30%", delay: "0.6s", dur: "6.5s", w: 28, h: 36, color: "#f43f5e" },
            { left: "45%", delay: "2.2s", dur: "9s",   w: 16, h: 21, color: "#22c55e" },
            { left: "58%", delay: "0.9s", dur: "7.5s", w: 22, h: 28, color: "#eab308" },
            { left: "70%", delay: "1.8s", dur: "8s",   w: 19, h: 25, color: "#3b82f6" },
            { left: "82%", delay: "0.3s", dur: "6.8s", w: 26, h: 34, color: "#ec4899" },
            { left: "91%", delay: "3.1s", dur: "7.2s", w: 17, h: 22, color: "#94a3b8" },
            { left: "12%", delay: "2.8s", dur: "8.2s", w: 20, h: 26, color: "#a855f7" },
            { left: "52%", delay: "1.1s", dur: "6.2s", w: 15, h: 20, color: "#f97316" },
          ] as { left: string; delay: string; dur: string; w: number; h: number; color: string }[]).map((p, i) => (
            <svg key={i} viewBox="0 0 48 62" width={p.w} height={p.h}
              style={{
                position: "absolute", bottom: "-40px", left: p.left,
                opacity: 0,
                animation: `pin-float ${p.dur} ${p.delay} ease-in infinite`,
                pointerEvents: "none", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
              }}>
              <circle cx="24" cy="24" r="22" fill={p.color} />
              <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <polygon points="24,58 16,40 32,40" fill={p.color} />
            </svg>
          ))}

          <div style={{
            position: "absolute",
            width: 140, height: 140, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(131,58,180,0.5) 0%, rgba(253,29,29,0.3) 50%, transparent 70%)",
            animation: "glow-pulse 2s ease-in-out infinite",
            zIndex: 1,
          }} />

          <svg viewBox="0 0 32 32" width="72" height="72"
            style={{ animation: "pin-pulse 1.8s ease-in-out infinite", zIndex: 2, filter: "drop-shadow(0 4px 16px rgba(253,29,29,0.5))" }}>
            <defs>
              <linearGradient id="loading-grad" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#833ab4" />
                <stop offset="50%" stopColor="#fd1d1d" />
                <stop offset="100%" stopColor="#fcb045" />
              </linearGradient>
            </defs>
            <path d="M16 2 C9.5 2 3 7.5 3 14 C3 21.5 16 31 16 31 C16 31 29 21.5 29 14 C29 7.5 22.5 2 16 2 Z" fill="url(#loading-grad)" />
            <circle cx="16" cy="13.5" r="5.5" fill="rgba(0,0,0,0.35)" />
            <path d="M17.5 8 L13 14.5 L16 14.5 L14.5 19.5 L19 13 L16 13 Z" fill="white" />
          </svg>

          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: 0, zIndex: 2 }}>
            Creating account…
          </p>
          {slowHint && (
            <p style={{
              color: "#6b7280", fontSize: 13, margin: 0, textAlign: "center",
              maxWidth: 260, lineHeight: 1.5, zIndex: 2,
              animation: "fade-in 0.4s ease",
            }}>
              Server is starting up, this may take a moment…
            </p>
          )}
        </div>
      )}

      <div style={{
        minHeight: "100vh",
      backgroundImage: `url(${mapBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(10,10,10,0.72)" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#16181D",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px",
            }}>
              📍
            </div>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0 }}>Create account</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0 0" }}>Join and start exploring events</p>
          </div>
          <ConfigProvider theme={{
            token: {
              colorBgContainer: "#23262d",
              colorText: "#fff",
              colorTextPlaceholder: "#6b7280",
              colorBorder: "#2e3138",
              colorPrimary: "#3897f0",
              colorTextLabel: "#d1d5db",
              colorError: "#ef4444",
            },
          }}>
            <Form form={form} name="register" size="large" onFinish={handleRegister} layout="vertical">
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Please input your username!" }]}
              >
                <Input placeholder="Enter username" disabled={loading} />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email address." },
                ]}
              >
                <Input placeholder="you@example.com" disabled={loading} />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  { min: 6, message: "Password must be at least 6 characters." },
                ]}
                hasFeedback
              >
                <Input.Password placeholder="Enter password" disabled={loading} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm password"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match."));
                    },
                  }),
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password placeholder="Confirm password" disabled={loading} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" className="hover-button" htmlType="submit" block loading={loading} style={{ height: 44, fontWeight: 600, fontSize: 15 }}>
                  {loading ? "Creating account…" : "Register"}
                </Button>
              </Form.Item>
            </Form>
          </ConfigProvider>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{"Already have an account? "}</span>
            <span
              onClick={() => router.push("/login")}
              className="hover-button"
              style={{ color: "#3897f0", fontSize: 14, cursor: "pointer", fontWeight: 500 }}
            >
              Login here
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;

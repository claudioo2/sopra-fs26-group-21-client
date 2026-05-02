"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, ConfigProvider } from "antd";

interface FormFieldProps {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/users/login", values);
      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);
      router.push("/map");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      }
    }
  };

  const mapBg = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/8.5417,47.3769,11/1280x800?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

  return (
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
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0 }}>Welcome back</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0 0" }}>Sign in to continue</p>
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
            <Form form={form} name="login" size="large" onFinish={handleLogin} layout="vertical">
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Please input your username!" }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Please input your password!" }]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block style={{ height: 44, fontWeight: 600, fontSize: 15 }}>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </ConfigProvider>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{"Don't have an account? "}</span>
            <span
              onClick={() => router.push("/register")}
              style={{ color: "#3897f0", fontSize: 14, cursor: "pointer", fontWeight: 500 }}
            >
              Register here
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

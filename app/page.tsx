"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { ArrowRightOutlined } from "@ant-design/icons";

export default function HomePage() {
  const router = useRouter();
  const apiService = useApi();

  useEffect(() => {
    apiService.get("/ping").catch(() => {
      // ignore errors; only used to wake up backend
    });
  }, [apiService]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #833ab4 0%, #fd1d1d22 12%, #0a0a0a 32%)",
        backgroundColor: "#0a0a0a",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#833ab4",
          filter: "blur(140px)",
          opacity: 0.22,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -220,
          left: "-120px", // <- wichtig gegen die "Säule"
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#fd1d1d",
          filter: "blur(160px)",
          opacity: 0.12,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 80,
          height: "100%",
          background:"linear-gradient(to right, rgba(10,10,10,0.55), transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          maxWidth: 1400,
          margin: "0 auto",
          padding: "22px 28px 34px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
            }}
          >
            <img
              src="/favicon.svg"
              alt="Spontaneo Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div>
            <p
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.5px",
              }}
            >
              Spontaneo
            </p>

            <p
              style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: 13 }}
            >
              Discover nearby events instantly
            </p>
          </div>

          <div
            style={{marginLeft: "auto"}}
          >
            <button
              onClick={() => router.push("/login")}
              className="hover-button"
              style={{
                height: 58,
                padding: "0 28px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255, 255, 255, 0.09)",
                backdropFilter: "blur(12px)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            paddingTop: 40,
            paddingBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{ flex: "1 1 520px", minWidth: 280, maxWidth: 620 }}
          >
            

            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "clamp(52px, 10vw, 88px)",
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: "-4px",
              }}
            >
              Explore.
              <br />
              Connect.
              <br />
              Experience.
            </h1>

            <p
              style={{
                marginTop: 24,
                color: "#9ca3af",
                fontSize: 17,
                lineHeight: 1.8,
                maxWidth: 560,
              }}
            >
              Explore spontaneous activities, connect with people nearby and
              experience your city in a completely new way.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 34,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => router.push("/register")}
                className="hover-button"
                style={{
                  height: 58,
                  padding: "0 30px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #833ab4, #6a2d93)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow:
                    "0 8px 34px rgba(131,58,180,0.45)",
                  transition: "0.2s ease",
                }}
              >
                Get Started Today
                <ArrowRightOutlined />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: "1 1 480px",
              minWidth: 280,
              maxWidth: 600,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1.15 / 1",
                borderRadius: 36,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                position: "relative",
                backgroundColor: "#111",
              }}
            >
              <img
                src="/map-preview.png"
                alt="Map Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(10,10,10,0.55), rgba(10,10,10,0.05))",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
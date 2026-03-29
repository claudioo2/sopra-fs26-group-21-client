"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";

export default function MapPage() {
  const router = useRouter();
  const api = useApi();

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isMounted) {
        setIsMounted(true);
        return;
    }
    
    if (!token) {
      window.alert("You are not authenticated. Please log in.");    // remove later
      router.push("/login");
      return;
    }

    const validate = async () => {
      try {
        await api.get("/auth/validate", {
          headers: { Authorization: `Bearer ${token}` }
        });

      } catch (err) {
        clearToken();
        console.log("222");
        router.push("/login");
      }
    };

    validate();
  }, [token, api, router, clearToken, isMounted]);

  const handleLogout = () => {
    setIsMounted(false);
    clearToken();
    router.push("/login");
  }

  // conditional rendering to prevent unathenticated users from seeing the map page
  if (token) {
    // where our map html code will come in but for now i just return a placeholder
    return (
      <main>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Map</h1>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid gray",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "gray",
          }}
        >
          Logout
        </button>
      </div>
        <p>Here comes our map which has to be merged from the other branch(es)</p>
      </main>
    );
  }
}

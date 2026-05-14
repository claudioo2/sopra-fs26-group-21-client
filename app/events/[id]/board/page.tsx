"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { App, Button, Input, Upload } from "antd";
import { ArrowLeftOutlined, PlusOutlined, PictureOutlined, CommentOutlined, SmileOutlined, UploadOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { UploadFile } from "antd/es/upload/interface";

type PostType = "photo" | "comment" | "emoji";

interface PostGetDTO {
  id: number;
  postType: "PHOTO" | "COMMENT" | "EMOJI";
  content: string | null;
  imageUrl: string | null;
  emoji: string | null;
  authorUsername: string;
  eventId: number;
  timestamp: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "#f97316", MUSIC: "#a855f7", FOOD: "#f43f5e", ART: "#ec4899",
  SOCIAL: "#3b82f6", OUTDOOR: "#22c55e", PARTY: "#eab308", OTHER: "#94a3b8",
};

const EMOJIS = ["😀","😂","❤️","🔥","👏","🎉","😍","🙌","💯","😎","🤩","😢","😮","👍","🥳"];

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const eventTitle = searchParams.get("title") ?? "Event Board";

  const { message: messageApi } = App.useApp();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [posts, setPosts] = useState<PostGetDTO[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [accentColor, setAccentColor] = useState("#75bd9d");
  const [modalOpen, setModalOpen] = useState(false);
  const [postType, setPostType] = useState<PostType | null>(null);
  const [comment, setComment] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !userId) return;
    apiService
      .get<PostGetDTO[]>(`/events/${eventId}/posts`, { Authorization: `Bearer ${token}` })
      .then(setPosts)
      .catch(() => {});
    apiService
      .get<{ creatorId: number | null; participantIds: number[] | null; category?: string }>(`/events/${eventId}`, { Authorization: `Bearer ${token}` })
      .then((event) => {
        const uid = Number(userId);
        setCanPost(event.creatorId === uid || (event.participantIds?.includes(uid) ?? false));
        if (event.category && CATEGORY_COLORS[event.category]) {
          setAccentColor(CATEGORY_COLORS[event.category]);
        }
      })
      .catch(() => {});
  }, [token, userId, eventId, apiService]);

  function openModal() {
    setPostType(null);
    setComment("");
    setSelectedEmoji(null);
    setFileList([]);
    setModalOpen(true);
  }

  async function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (postType === "photo" && fileList[0]?.originFileObj) {
        imageUrl = await toBase64(fileList[0].originFileObj as File);
      }
      const payload = {
        token,
        postType: postType!.toUpperCase(),
        content: postType !== "emoji" ? comment || null : null,
        imageUrl,
        emoji: postType === "emoji" ? selectedEmoji : null,
      };
      const created = await apiService.post<PostGetDTO>(`/events/${eventId}/posts`, payload);
      setPosts((prev) => [...prev, created]);
      setModalOpen(false);
    } catch {
      messageApi.error("Failed to post. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()} · ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}66 8%, ${accentColor}22 18%, #0a0a0a 32%)`, backgroundColor: "#0a0a0a" }}>

      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <ArrowLeftOutlined />
        </button>
        <h1 style={{ margin: 0, flex: 1, fontSize: 18, fontWeight: 700, color: "#fff", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {eventTitle}
        </h1>
        {canPost ? (
          <button
            onClick={openModal}
            style={{ background: accentColor, border: "none", borderRadius: 999, height: 36, padding: "0 16px", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            <PlusOutlined /> Post
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      {/* Posts grid */}
      <div style={{ padding: "12px 16px 40px", maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {posts.length === 0 && (
          <p style={{ color: "#6b7280", textAlign: "center", width: "100%", marginTop: 60, fontSize: 14 }}>No posts yet. Be the first!</p>
        )}
        {posts.map((post) => (
          <div key={post.id} style={{
            backgroundColor: "#16181D",
            borderRadius: 16,
            padding: "14px 16px",
            border: "1px solid #2e3138",
            width: "calc(33.333% - 8px)",
            minWidth: 200,
            boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{post.authorUsername}</span>
              <span style={{ color: "#6b7280", fontSize: 11 }}>{fmt(post.timestamp)}</span>
            </div>
            {post.postType === "PHOTO" && post.imageUrl && (
              <img src={post.imageUrl} alt="post" style={{ width: "100%", borderRadius: 10, marginBottom: post.content ? 8 : 0 }} />
            )}
            {post.postType === "EMOJI" && (
              <div style={{ fontSize: 48, textAlign: "center", padding: "8px 0" }}>{post.emoji}</div>
            )}
            {post.content && (
              <p style={{ margin: 0, color: "#d1d5db", fontSize: 14, lineHeight: 1.55 }}>{post.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* New Post overlay */}
      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, backgroundColor: "#16181D", borderRadius: "24px 24px 0 0", padding: "20px 20px 36px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: "#3a3f4a", margin: "0 auto 8px" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
                {postType ? (postType === "photo" ? "📷 Photo" : postType === "comment" ? "💬 Comment" : "😀 Emoji") : "New Post"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "#23262d", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Type selector */}
            {!postType && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { type: "photo" as PostType, icon: <PictureOutlined />, label: "Photo + Comment", sub: "Upload a photo with optional caption" },
                  { type: "comment" as PostType, icon: <CommentOutlined />, label: "Comment", sub: "Write a text post" },
                  { type: "emoji" as PostType, icon: <SmileOutlined />, label: "Emoji", sub: "React with an emoji" },
                ].map(({ type, icon, label, sub }) => (
                  <button key={type} onClick={() => setPostType(type)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#23262d", border: "1px solid #2e3138", borderRadius: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span style={{ fontSize: 22, color: accentColor }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {postType === "photo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Upload listType="picture-card" fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} beforeUpload={() => false} maxCount={1}>
                  {fileList.length === 0 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                </Upload>
                <Input.TextArea rows={3} placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} style={{ backgroundColor: "#23262d", borderColor: "#2e3138", color: "#fff" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPostType(null)} style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid #2e3138", background: "#23262d", color: "#d1d5db", fontWeight: 500, cursor: "pointer" }}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting || fileList.length === 0} style={{ flex: 2, height: 44, borderRadius: 999, border: "none", background: accentColor, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: fileList.length === 0 ? 0.5 : 1 }}>
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}

            {postType === "comment" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input.TextArea rows={4} placeholder="Write something..." value={comment} onChange={e => setComment(e.target.value)} autoFocus style={{ backgroundColor: "#23262d", borderColor: "#2e3138", color: "#fff" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPostType(null)} style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid #2e3138", background: "#23262d", color: "#d1d5db", fontWeight: 500, cursor: "pointer" }}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting || !comment.trim()} style={{ flex: 2, height: 44, borderRadius: 999, border: "none", background: accentColor, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: !comment.trim() ? 0.5 : 1 }}>
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}

            {postType === "emoji" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setSelectedEmoji(e)} style={{ fontSize: 28, background: selectedEmoji === e ? accentColor + "33" : "#23262d", border: selectedEmoji === e ? `2px solid ${accentColor}` : "2px solid #2e3138", borderRadius: 10, cursor: "pointer", padding: "6px 10px" }}>
                      {e}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPostType(null)} style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid #2e3138", background: "#23262d", color: "#d1d5db", fontWeight: 500, cursor: "pointer" }}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting || !selectedEmoji} style={{ flex: 2, height: 44, borderRadius: 999, border: "none", background: accentColor, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: !selectedEmoji ? 0.5 : 1 }}>
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

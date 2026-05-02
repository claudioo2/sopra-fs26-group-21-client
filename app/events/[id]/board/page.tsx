"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { App, Button, Modal, Input, Upload } from "antd";
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
      .get<{ creatorId: number | null; participantIds: number[] | null }>(`/events/${eventId}`, { Authorization: `Bearer ${token}` })
      .then((event) => {
        const uid = Number(userId);
        const isCreator = event.creatorId === uid;
        const isParticipant = event.participantIds?.includes(uid) ?? false;
        setCanPost(isCreator || isParticipant);
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

      const created = await apiService.post<PostGetDTO>(
        `/events/${eventId}/posts`,
        payload
      );

      setPosts((prev) => [...prev, created]);
      setModalOpen(false);
    } catch {
      messageApi.error("Failed to post. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <button
          onClick={() => router.push("/map")}
          style={{
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#374151",
            fontSize: "16px",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          <ArrowLeftOutlined />
        </button>

        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#111827", flex: 1, textAlign: "center" }}>
          {eventTitle}
        </h1>

        {canPost && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#6b7280", borderColor: "#6b7280" }}
            onClick={openModal}
          >
            Add Post
          </Button>
        )}
      </header>

      <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {posts.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "60px" }}>No posts yet.</p>
        )}
        {posts.map((post) => (
          <div key={post.id} style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #e5e7eb",
            width: "calc(33.333% - 11px)",
            minWidth: "200px",
            boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>{post.authorUsername}</span>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>{new Date(post.timestamp).toLocaleString()}</span>
            </div>
            {post.postType === "PHOTO" && post.imageUrl && (
              <img src={post.imageUrl} alt="post" style={{ width: "100%", borderRadius: "8px", marginBottom: post.content ? "8px" : 0 }} />
            )}
            {post.postType === "EMOJI" && (
              <div style={{ fontSize: 48, textAlign: "center", padding: "8px 0" }}>{post.emoji}</div>
            )}
            {post.content && (
              <p style={{ margin: 0, color: "#374151", fontSize: "14px" }}>{post.content}</p>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title="New Post"
        width={380}
      >
        {!postType && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
            <button onClick={() => setPostType("photo")} style={typeButtonStyle}>
              <PictureOutlined style={{ fontSize: 22, color: "#6b7280" }} />
              <div>
                <div style={{ fontWeight: 600, color: "#111827" }}>Photo + Comment</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Upload a photo with an optional caption</div>
              </div>
            </button>
            <button onClick={() => setPostType("comment")} style={typeButtonStyle}>
              <CommentOutlined style={{ fontSize: 22, color: "#6b7280" }} />
              <div>
                <div style={{ fontWeight: 600, color: "#111827" }}>Comment</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Write a text post</div>
              </div>
            </button>
            <button onClick={() => setPostType("emoji")} style={typeButtonStyle}>
              <SmileOutlined style={{ fontSize: 22, color: "#6b7280" }} />
              <div>
                <div style={{ fontWeight: 600, color: "#111827" }}>Emoji</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>React with an emoji</div>
              </div>
            </button>
          </div>
        )}

        {postType === "photo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
              )}
            </Upload>
            <Input.TextArea rows={3} placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => setPostType(null)}>Back</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={fileList.length === 0}>Post</Button>
            </div>
          </div>
        )}

        {postType === "comment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input.TextArea rows={4} placeholder="Write something..." value={comment} onChange={e => setComment(e.target.value)} autoFocus />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => setPostType(null)}>Back</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!comment.trim()}>Post</Button>
            </div>
          </div>
        )}

        {postType === "emoji" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  style={{
                    fontSize: 28,
                    background: selectedEmoji === e ? "#e5e7eb" : "none",
                    border: selectedEmoji === e ? "2px solid #6b7280" : "2px solid transparent",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => setPostType(null)}>Back</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedEmoji}>Post</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const typeButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "14px 16px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
};

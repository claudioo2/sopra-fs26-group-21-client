"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button, Modal, Input, Upload } from "antd";
import { ArrowLeftOutlined, PlusOutlined, PictureOutlined, CommentOutlined, SmileOutlined, UploadOutlined } from "@ant-design/icons";

type PostType = "photo" | "comment" | "emoji";

const EMOJIS = ["😀","😂","❤️","🔥","👏","🎉","😍","🙌","💯","😎","🤩","😢","😮","👍","🥳"];

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventTitle = searchParams.get("title") ?? "Event Board";

  const [modalOpen, setModalOpen] = useState(false);
  const [postType, setPostType] = useState<PostType | null>(null);
  const [comment, setComment] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  function openModal() {
    setPostType(null);
    setComment("");
    setSelectedEmoji(null);
    setFileList([]);
    setModalOpen(true);
  }

  function handleSubmit() {
    // TODO: connect to API
    setModalOpen(false);
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

        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ backgroundColor: "#6b7280", borderColor: "#6b7280" }}
          onClick={openModal}
        >
          Add Post
        </Button>
      </header>

      <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
        <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "60px" }}>No posts yet.</p>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title="New Post"
        width={380}
      >
        {/* Step 1: choose type */}
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

        {/* Step 2a: photo + comment */}
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
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            <Input.TextArea
              rows={3}
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => setPostType(null)}>Back</Button>
              <Button type="primary" onClick={handleSubmit} disabled={fileList.length === 0}>Post</Button>
            </div>
          </div>
        )}

        {/* Step 2b: comment only */}
        {postType === "comment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input.TextArea
              rows={4}
              placeholder="Write something..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => setPostType(null)}>Back</Button>
              <Button type="primary" onClick={handleSubmit} disabled={!comment.trim()}>Post</Button>
            </div>
          </div>
        )}

        {/* Step 2c: emoji */}
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
              <Button type="primary" onClick={handleSubmit} disabled={!selectedEmoji}>Post</Button>
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

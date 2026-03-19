import { useState, useRef } from "react";
import { COLORS } from "../../colors";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD || "dltsekfui";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "devotion_upload";

/**
 * Reusable image upload component that uploads directly to Cloudinary.
 *
 * Props:
 *  - value: current image URL (or null)
 *  - onChange: called with the new Cloudinary URL on success
 *  - aspect: "square" or "banner" (controls preview shape)
 *  - label: display label
 *  - accentColor: dynamic church accent for styling
 */
export default function ImageUpload({ value, onChange, aspect = "square", label, accentColor }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const accent = accentColor || COLORS.accent;

  const isSquare = aspect === "square";
  const previewW = isSquare ? 120 : "100%";
  const previewH = isSquare ? 120 : 160;
  const radius = isSquare ? "50%" : 16;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "devotion-churches");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          onChange(data.secure_url);
        } else {
          setError("Upload failed. Try again.");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setError("Upload failed. Check your connection.");
      };

      xhr.send(formData);
    } catch {
      setUploading(false);
      setError("Upload failed.");
    }
  }

  function handleRemove() {
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>}

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          width: previewW,
          height: previewH,
          borderRadius: radius,
          border: `2px dashed ${value ? "transparent" : COLORS.border}`,
          background: value ? "transparent" : COLORS.bgDeep,
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s",
        }}
      >
        {value ? (
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>Click to upload</div>
          </div>
        )}

        {uploading && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: radius,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{progress}%</div>
              <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: "#fff", transition: "width 0.2s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

      {value && !uploading && (
        <button onClick={handleRemove} style={{
          marginTop: 8, padding: "4px 12px", borderRadius: 6,
          border: `1px solid ${COLORS.red}30`, background: COLORS.redBg,
          color: COLORS.red, fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "var(--body)",
        }}>Remove</button>
      )}

      {error && <div style={{ marginTop: 6, fontSize: 12, color: COLORS.red }}>{error}</div>}
    </div>
  );
}

/**
 * Circle avatar with initials or image.
 * Usage: <Avatar initials="KK" size={32} />
 *        <Avatar initials="SM" size={36} bg="#e8f0e9" color="#3d6b44" />
 */

export default function Avatar({ initials, color = "#5a5647", bg = "#e8e2d8", size = 32, src }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 600,
      color, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

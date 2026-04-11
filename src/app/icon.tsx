import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0f1623",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Toque de graduation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            marginTop: -1,
          }}
        >
          {/* Chapeau plat (dessus de la toque) */}
          <div
            style={{
              width: 22,
              height: 5,
              background: "#f5f0e8",
              borderRadius: 2,
              display: "flex",
            }}
          />
          {/* Corps de la toque */}
          <div
            style={{
              width: 14,
              height: 8,
              background: "#f5f0e8",
              borderRadius: "0 0 3px 3px",
              display: "flex",
            }}
          />
          {/* Étoile / accent rouge */}
          <div
            style={{
              width: 5,
              height: 5,
              background: "#d94f2b",
              borderRadius: "50%",
              display: "flex",
              marginTop: 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}

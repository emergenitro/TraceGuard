import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TraceGuard - IP Monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#191c22",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#ffb000",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#8a8f99",
              textTransform: "uppercase",
            }}
          >
            System Status: Active
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "88px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            SECURE YOUR{" "}
            <span style={{ color: "#ffb000" }}>DIGITAL</span>
            {" "}ASSETS.
          </div>
          <p
            style={{
              fontSize: "22px",
              color: "#8a8f99",
              fontWeight: 300,
              maxWidth: "680px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Forensic-level intellectual property monitoring. Global real-time
            scanning for unauthorized trademark, patent, and copyright infringements.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #2a2d35",
            paddingTop: "24px",
          }}
        >
          <span
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#ffb000",
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            TRACEGUARD
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "#8a8f99",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            trace-guard-omega.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

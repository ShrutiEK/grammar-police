import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const displayUrl = siteConfig.url.replace(/^https?:\/\//, "");

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#fff9ed",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "28px",
            height: "72px",
            backgroundColor: "#ffbd3e",
            borderRadius: "9999px",
            marginRight: "28px",
          }}
        />
        <div
          style={{
            fontSize: "40px",
            fontWeight: 700,
            color: "#17213d",
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: "82px",
            fontWeight: 800,
            color: "#17213d",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Friendly English speaking &amp; reading practice
        </div>
        <div
          style={{
            marginTop: "32px",
            fontSize: "34px",
            color: "#343c52",
            maxWidth: "920px",
            lineHeight: 1.35,
          }}
        >
          Practise real conversations, describe scenes, read aloud, and get
          instant, encouraging feedback.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "28px", color: "#7a3e00", fontWeight: 600 }}>
          {displayUrl}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#17213d",
            color: "#fff9ed",
            fontSize: "26px",
            fontWeight: 700,
            padding: "14px 30px",
            borderRadius: "9999px",
          }}
        >
          AI English tutor
        </div>
      </div>
    </div>,
    { ...size },
  );
}

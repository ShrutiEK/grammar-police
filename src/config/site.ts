/**
 * Public, non-secret site metadata shared by the App Router `metadata`,
 * the sitemap, robots, the web manifest, and the social share image.
 *
 * Override the URL per environment with `NEXT_PUBLIC_SITE_URL` (e.g. a preview
 * deployment); it falls back to the production domain. Any trailing slash is
 * stripped so callers can safely append paths.
 */
const FALLBACK_URL = "https://lingo-jungle-tau.vercel.app";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL)
  .trim()
  .replace(/\/+$/, "");

export const siteConfig = {
  name: "Lingo Jungle",
  title: "Lingo Jungle — Friendly English Speaking & Reading Practice",
  tagline: "Friendly English speaking & reading practice",
  description:
    "Lingo Jungle is a friendly, AI-powered English tutor. Practise real conversations, describe scenes, read aloud, and get instant, encouraging feedback.",
  url: siteUrl,
  locale: "en_US",
  keywords: [
    "learn English",
    "English speaking practice",
    "English conversation practice",
    "reading practice",
    "English tutor",
    "AI English tutor",
    "ESL",
    "spoken English",
    "English fluency",
  ],
} as const;

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/features/state-sync/session";

/**
 * Anonymous per-learner identity. The app has no accounts, so every browser
 * gets a random, httpOnly `gp_session` cookie which namespaces its data in
 * Redis (`gp:{sid}:*`). This is the only thing the proxy does — session
 * metadata (IP / geo / user-agent) is captured lazily on the first state write.
 */

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~13 months

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE_NAME)) {
    response.cookies.set(SESSION_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      // Secure everywhere except local `http` dev, where browsers would drop it.
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  // Run on pages and API routes, but skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

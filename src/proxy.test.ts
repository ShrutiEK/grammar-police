import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/features/state-sync/session";

import { proxy } from "./proxy";

describe("session cookie proxy", () => {
  it("mints an httpOnly session cookie when none is present", () => {
    const response = proxy(new NextRequest("https://example.com/assessment"));

    const cookie = response.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/");
  });

  it("leaves an existing session cookie untouched", () => {
    const request = new NextRequest("https://example.com/assessment");
    request.cookies.set(SESSION_COOKIE_NAME, "existing-id");

    const response = proxy(request);

    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });
});

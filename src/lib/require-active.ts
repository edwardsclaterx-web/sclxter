import { NextResponse } from "next/server";
import { userIsActive } from "./access";
import type { User } from "./types";

export function requireActiveUser(user: User | null): User | NextResponse {
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (!userIsActive(user)) {
    return NextResponse.json({ error: "Buy first." }, { status: 403 });
  }
  return user;
}

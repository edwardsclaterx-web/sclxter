import "server-only";

import { LEAVESAKE_LOGIN, LEAVESAKE_USER_ID } from "./leavesake";
import { NORTHGATE_LOGIN, NORTHGATE_USER_ID } from "./northgate";
import { OWNER_USER_ID, ownerUserRecord } from "./owner-auth";
import { readStore } from "./store";
import type { User } from "./types";

function stub(id: string, email: string): User {
  return {
    id,
    email,
    passwordHash: "!",
    createdAt: "2026-10-01T09:00:00.000Z",
  };
}

export function northgateStub() {
  return stub(NORTHGATE_USER_ID, NORTHGATE_LOGIN);
}

export function leavesakeStub() {
  return stub(LEAVESAKE_USER_ID, LEAVESAKE_LOGIN);
}

export async function userById(userId: string): Promise<User | null> {
  try {
    const found = (await readStore()).users.find((u) => u.id === userId);
    if (found) return found;
  } catch {
    /* store may be down; known identities still work */
  }
  if (userId === OWNER_USER_ID) return ownerUserRecord();
  if (userId === NORTHGATE_USER_ID) return northgateStub();
  if (userId === LEAVESAKE_USER_ID) return leavesakeStub();
  return null;
}

import { randomBytes } from "node:crypto";

export function id(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function publicId() {
  return randomBytes(6).toString("hex");
}

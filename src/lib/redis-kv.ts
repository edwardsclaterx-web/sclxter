import "server-only";

import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";

function asArg(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function encodeResp(args: unknown[]) {
  const parts = args.map(asArg);
  let out = `*${parts.length}\r\n`;
  for (const part of parts) {
    const buf = Buffer.from(part, "utf8");
    out += `$${buf.length}\r\n${part}\r\n`;
  }
  return out;
}

function parseResp(buf: Buffer): { value: unknown; error?: string; rest: Buffer } | null {
  if (buf.length < 1) return null;
  const nl = buf.indexOf("\r\n");
  if (nl < 0) return null;
  const type = buf[0];
  const head = buf.subarray(1, nl).toString("utf8");
  if (type === 43) {
    return { value: head, rest: buf.subarray(nl + 2) };
  }
  if (type === 45) {
    return { value: null, error: head, rest: buf.subarray(nl + 2) };
  }
  if (type === 58) {
    return { value: Number(head), rest: buf.subarray(nl + 2) };
  }
  if (type === 36) {
    const len = Number(head);
    if (len < 0) return { value: null, rest: buf.subarray(nl + 2) };
    const start = nl + 2;
    const end = start + len;
    if (buf.length < end + 2) return null;
    return {
      value: buf.subarray(start, end).toString("utf8"),
      rest: buf.subarray(end + 2),
    };
  }
  return { value: null, error: "unsupported redis reply", rest: buf.subarray(nl + 2) };
}

function readReply(socket: Socket, timeoutMs: number) {
  return new Promise<{ value: unknown; error?: string }>((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("redis timeout"));
    }, timeoutMs);
    const onData = (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      const parsed = parseResp(buf);
      if (!parsed) return;
      cleanup();
      if (parsed.error) resolve({ value: parsed.value, error: parsed.error });
      else resolve({ value: parsed.value });
    };
    const onErr = (err: Error) => {
      cleanup();
      reject(err);
    };
    const onEnd = () => {
      cleanup();
      reject(new Error("redis closed"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onErr);
      socket.off("end", onEnd);
    };
    socket.on("data", onData);
    socket.on("error", onErr);
    socket.on("end", onEnd);
  });
}

function connectRedis(host: string, port: number, tls: boolean, timeoutMs: number) {
  return new Promise<Socket>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("redis connect timeout"));
    }, timeoutMs);
    const onReady = () => {
      clearTimeout(timer);
      socket.off("error", onErr);
      resolve(socket);
    };
    const onErr = (err: Error) => {
      clearTimeout(timer);
      reject(err);
    };
    const socket = tls
      ? tlsConnect({ host, port, servername: host, timeout: timeoutMs }, onReady)
      : netConnect({ host, port, timeout: timeoutMs }, onReady);
    socket.once("error", onErr);
  });
}

export async function redisCommand(redisUrl: string, command: unknown[]) {
  const timeoutMs = 8000;
  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    return { ok: false as const, error: "invalid redis url" };
  }
  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 6379;
  const tls = parsed.protocol === "rediss:";
  const user = decodeURIComponent(parsed.username || "default");
  const password = decodeURIComponent(parsed.password || "");
  if (!host || !password) {
    return { ok: false as const, error: "invalid redis url" };
  }

  let socket: Socket | null = null;
  try {
    socket = await connectRedis(host, port, tls, timeoutMs);
    socket.setNoDelay(true);
    const attempts = [
      ["AUTH", user, password],
      ["AUTH", password],
    ];
    let authed = false;
    let authError = "AUTH failed";
    for (const auth of attempts) {
      socket.write(encodeResp(auth));
      const reply = await readReply(socket, timeoutMs);
      if (!reply.error && reply.value === "OK") {
        authed = true;
        break;
      }
      authError = reply.error || String(reply.value || "AUTH failed");
    }
    if (!authed) {
      return { ok: false as const, error: authError };
    }
    socket.write(encodeResp(command));
    const reply = await readReply(socket, timeoutMs);
    if (reply.error) {
      return { ok: false as const, error: reply.error };
    }
    return { ok: true as const, result: reply.value };
  } catch (err) {
    const message = err instanceof Error ? err.message : "redis failed";
    const cause =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
    return { ok: false as const, error: cause ? `${message}: ${cause}` : message };
  } finally {
    socket?.end();
    socket?.destroy();
  }
}

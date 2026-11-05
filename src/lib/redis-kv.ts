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

function parseResp(
  buf: Buffer,
): { value: unknown; error?: string; rest: Buffer } | null {
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
  if (type === 42) {
    const count = Number(head);
    if (count < 0) return { value: null, rest: buf.subarray(nl + 2) };
    let rest = buf.subarray(nl + 2);
    const items: unknown[] = [];
    for (let i = 0; i < count; i += 1) {
      const parsed = parseResp(rest);
      if (!parsed) return null;
      if (parsed.error) {
        return { value: items, error: parsed.error, rest: parsed.rest };
      }
      items.push(parsed.value);
      rest = parsed.rest;
    }
    return { value: items, rest };
  }
  return { value: null, error: "unsupported redis reply", rest: buf.subarray(nl + 2) };
}

type Pool = {
  url: string;
  socket: Socket;
  buf: Buffer;
  chain: Promise<unknown>;
};

const pools = new Map<string, Pool>();

function dropPool(url: string, socket?: Socket) {
  const pool = pools.get(url);
  const victim =
    pool && (!socket || pool.socket === socket) ? pool.socket : socket;
  if (pool && pool.socket === victim) pools.delete(url);
  if (victim) {
    try {
      victim.destroy();
    } catch {
      /* ignore */
    }
  }
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

function readOne(pool: Pool, timeoutMs: number) {
  return new Promise<{ value: unknown; error?: string }>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      dropPool(pool.url, pool.socket);
      reject(new Error("redis timeout"));
    }, timeoutMs);
    const finish = (parsed: { value: unknown; error?: string; rest: Buffer }) => {
      cleanup();
      pool.buf = parsed.rest;
      if (parsed.error) resolve({ value: parsed.value, error: parsed.error });
      else resolve({ value: parsed.value });
    };
    const onData = (chunk: Buffer) => {
      pool.buf = Buffer.concat([pool.buf, chunk]);
      const parsed = parseResp(pool.buf);
      if (parsed) finish(parsed);
    };
    const onErr = (err: Error) => {
      cleanup();
      dropPool(pool.url, pool.socket);
      reject(err);
    };
    const onEnd = () => {
      cleanup();
      dropPool(pool.url, pool.socket);
      reject(new Error("redis closed"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      pool.socket.off("data", onData);
      pool.socket.off("error", onErr);
      pool.socket.off("end", onEnd);
    };
    const already = parseResp(pool.buf);
    if (already) {
      finish(already);
      return;
    }
    pool.socket.on("data", onData);
    pool.socket.on("error", onErr);
    pool.socket.on("end", onEnd);
  });
}

async function authSocket(socket: Socket, user: string, password: string, timeoutMs: number) {
  const pool: Pool = {
    url: "auth",
    socket,
    buf: Buffer.alloc(0),
    chain: Promise.resolve(),
  };
  const attempts = [
    ["AUTH", user, password],
    ["AUTH", password],
  ];
  let authError = "AUTH failed";
  for (const auth of attempts) {
    socket.write(encodeResp(auth));
    const reply = await readOne(pool, timeoutMs);
    if (!reply.error && reply.value === "OK") {
      return pool.buf;
    }
    authError = reply.error || String(reply.value || "AUTH failed");
  }
  throw new Error(authError);
}

async function ensurePool(redisUrl: string, timeoutMs: number): Promise<Pool> {
  const existing = pools.get(redisUrl);
  if (existing && !existing.socket.destroyed) return existing;
  if (existing) dropPool(redisUrl, existing.socket);

  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error("invalid redis url");
  }
  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 6379;
  const tls = parsed.protocol === "rediss:";
  const user = decodeURIComponent(parsed.username || "default");
  const password = decodeURIComponent(parsed.password || "");
  if (!host || !password) throw new Error("invalid redis url");

  const socket = await connectRedis(host, port, tls, timeoutMs);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 15000);
  socket.on("error", () => dropPool(redisUrl, socket));
  socket.on("end", () => dropPool(redisUrl, socket));
  socket.on("close", () => dropPool(redisUrl, socket));
  const leftover = await authSocket(socket, user, password, timeoutMs);
  const pool: Pool = {
    url: redisUrl,
    socket,
    buf: leftover,
    chain: Promise.resolve(),
  };
  pools.set(redisUrl, pool);
  return pool;
}

export async function redisPipeline(redisUrl: string, commands: unknown[][]) {
  const timeoutMs = 8000;
  if (!commands.length) return [];
  try {
    const pool = await ensurePool(redisUrl, timeoutMs);
    const run = pool.chain.then(async () => {
      for (const command of commands) {
        pool.socket.write(encodeResp(command));
      }
      const results: { ok: boolean; result?: unknown; error?: string }[] = [];
      for (let i = 0; i < commands.length; i += 1) {
        const reply = await readOne(pool, timeoutMs);
        if (reply.error) {
          results.push({ ok: false, error: reply.error });
        } else {
          results.push({ ok: true, result: reply.value });
        }
      }
      return results;
    });
    pool.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return await run;
  } catch (err) {
    dropPool(redisUrl);
    const message = err instanceof Error ? err.message : "redis failed";
    const cause =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
    return commands.map(() => ({
      ok: false as const,
      error: cause ? `${message}: ${cause}` : message,
    }));
  }
}

export async function redisCommand(redisUrl: string, command: unknown[]) {
  const [row] = await redisPipeline(redisUrl, [command]);
  if (!row) return { ok: false as const, error: "redis failed" };
  if (row.ok) return { ok: true as const, result: row.result };
  return { ok: false as const, error: row.error || "redis failed" };
}

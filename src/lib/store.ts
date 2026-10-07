import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { seedIfEmpty } from "./seed";
import type { StoreData } from "./types";

const DATA_PATH = join(process.cwd(), "data", "store.json");

const empty = (): StoreData => ({
  users: [],
  businesses: [],
  knowledge: [],
  leads: [],
});

let cache: StoreData | null = null;
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => T): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function readDisk(): StoreData {
  if (!existsSync(DATA_PATH)) return empty();
  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as StoreData;
    return {
      users: parsed.users ?? [],
      businesses: parsed.businesses ?? [],
      knowledge: parsed.knowledge ?? [],
      leads: parsed.leads ?? [],
    };
  } catch {
    return empty();
  }
}

function writeDisk(data: StoreData) {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function readStore(): Promise<StoreData> {
  return withLock(() => {
    if (!cache) {
      cache = readDisk();
      seedIfEmpty(cache);
      writeDisk(cache);
    }
    return cache;
  });
}

export async function updateStore<T>(
  fn: (data: StoreData) => T,
): Promise<T> {
  return withLock(() => {
    if (!cache) {
      cache = readDisk();
      seedIfEmpty(cache);
    }
    const result = fn(cache);
    writeDisk(cache);
    return result;
  });
}

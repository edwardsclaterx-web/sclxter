export function isChunkLoadError(error: unknown) {
  if (!error) return false;
  const name = typeof error === "object" && "name" in error ? String(error.name) : "";
  const message =
    typeof error === "object" && "message" in error
      ? String(error.message)
      : String(error);
  const text = `${name} ${message}`;
  return (
    name === "ChunkLoadError" ||
    /Loading chunk/i.test(text) ||
    /Failed to load chunk/i.test(text) ||
    /Failed to fetch dynamically imported module/i.test(text) ||
    /error loading dynamically imported module/i.test(text) ||
    /CSS chunk load error/i.test(text)
  );
}

const KEY = "sclxter-chunk-reload";

export function reloadOnceOnChunkError(error: unknown) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  try {
    if (sessionStorage.getItem(KEY) === "1") return false;
    sessionStorage.setItem(KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

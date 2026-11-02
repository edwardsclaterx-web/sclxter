"use client";

import { useEffect } from "react";
import {
  clearChunkReloadFlag,
  reloadOnceOnChunkError,
} from "@/lib/chunk-error";

export function ChunkRecovery() {
  useEffect(() => {
    clearChunkReloadFlag();
    function onError(e: ErrorEvent) {
      reloadOnceOnChunkError(e.error || e.message);
    }
    function onReject(e: PromiseRejectionEvent) {
      reloadOnceOnChunkError(e.reason);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { reloadOnceOnChunkError } from "@/lib/chunk-error";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reloadOnceOnChunkError(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-20">
      <p className="text-lg font-medium tracking-tight text-fg">
        Something went wrong
      </p>
      <button
        type="button"
        className="mt-8 inline-flex h-10 items-center bg-accent px-4 text-sm text-accent-fg"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}

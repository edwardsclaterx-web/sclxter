"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SaveFn = () => Promise<boolean>;

const UnsavedCtx = createContext<{
  setDirty: (dirty: boolean) => void;
  setSave: (fn: SaveFn | null) => void;
} | null>(null);

export function useUnsavedGuard() {
  return useContext(UnsavedCtx);
}

export function UnsavedGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dirty = useRef(false);
  const save = useRef<SaveFn | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setDirty = useCallback((next: boolean) => {
    dirty.current = next;
  }, []);

  const setSave = useCallback((fn: SaveFn | null) => {
    save.current = fn;
  }, []);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dirty.current || prompt) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      let next: URL;
      try {
        next = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (next.origin !== window.location.origin) return;
      const here = window.location.pathname + window.location.search;
      const dest = next.pathname + next.search;
      if (dest === here) return;
      e.preventDefault();
      e.stopPropagation();
      setPrompt(dest + next.hash);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [prompt]);

  async function confirmYes() {
    if (!prompt) return;
    setBusy(true);
    const ok = save.current ? await save.current() : true;
    setBusy(false);
    if (!ok) {
      setPrompt(null);
      return;
    }
    dirty.current = false;
    const dest = prompt;
    setPrompt(null);
    router.push(dest);
  }

  return (
    <UnsavedCtx.Provider value={{ setDirty, setSave }}>
      {children}
      {prompt ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-changes-title"
            className="w-full max-w-sm border border-line bg-bg p-6 text-fg"
          >
            <p id="save-changes-title" className="text-lg font-medium tracking-tight">
              Save changes
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                className="inline-flex h-10 items-center bg-accent px-4 text-sm text-accent-fg disabled:opacity-50"
                onClick={() => void confirmYes()}
              >
                {busy ? "Saving…" : "Yes"}
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex h-10 items-center border border-line px-4 text-sm text-fg disabled:opacity-50"
                onClick={() => setPrompt(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </UnsavedCtx.Provider>
  );
}

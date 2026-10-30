"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { WidgetForm } from "@/app/widget/[publicId]/widget-form";
import { FieldError } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientBusiness, WidgetTheme } from "@/lib/types";
import { NOTEPAD_NOTICE, TONES } from "@/lib/tones";
import { TEST_AI_BLOCKED, businessReadyForTest } from "@/lib/test-ai";
import { normalizeTheme } from "@/lib/widget-theme";
import { EmbedGuide } from "./embed-guide";
import { InstructionsBanner } from "./instructions-banner";
import { ThemePicker } from "./theme-picker";

type Props = {
  admin: boolean;
  business: ClientBusiness;
  instructions: string[];
  live?: boolean;
};

const SCAN_FAIL =
  "error with scan send your website to administrator for information to be extracted";

export function BusinessScreen({
  admin,
  business,
  instructions,
  live = true,
}: Props) {
  const router = useRouter();
  const seq = admin ? business.seq : undefined;
  const [name, setName] = useState(business.name);
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl);
  const [industry, setIndustry] = useState(business.industry);
  const [contactPhone, setContactPhone] = useState(business.contactPhone);
  const [contactEmail, setContactEmail] = useState(business.contactEmail);
  const [contactOther, setContactOther] = useState(business.contactOther);
  const [tone, setTone] = useState(business.tone || "plain");
  const [theme, setTheme] = useState<WidgetTheme>(() =>
    normalizeTheme(business.theme),
  );
  const [themeError, setThemeError] = useState<string | null>(null);
  const [notepad, setNotepad] = useState(business.notepad);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwNote, setPwNote] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const hist = useRef<string[]>([business.notepad]);
  const histI = useRef(0);

  function patchPad(next: string, record = true) {
    setNotepad(next);
    if (!record) return;
    const h = hist.current.slice(0, histI.current + 1);
    if (h[h.length - 1] === next) return;
    h.push(next);
    hist.current = h.slice(-80);
    histI.current = hist.current.length - 1;
  }

  function undo() {
    if (histI.current <= 0) return;
    histI.current -= 1;
    setNotepad(hist.current[histI.current]);
  }

  function redo() {
    if (histI.current >= hist.current.length - 1) return;
    histI.current += 1;
    setNotepad(hist.current[histI.current]);
  }

  async function saveFields(extra?: Record<string, string>) {
    setSaving(true);
    setSaveNote(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seq,
          name,
          websiteUrl,
          industry,
          contactPhone,
          contactEmail,
          contactOther,
          tone,
          notepad,
          ...extra,
        }),
      });
      if (!res.ok) {
        setSaveError("Could not save.");
        return false;
      }
      setSaveNote("Saved.");
      router.refresh();
      return true;
    } catch {
      setSaveError("Could not reach the server.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await saveFields();
  }

  async function onTheme(next: WidgetTheme) {
    if (next.primary === next.text) {
      setThemeError("Text and primary must be different colours.");
      return;
    }
    setTheme(next);
    setThemeError(null);
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seq, theme: next }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setThemeError(data.error || "Could not save theme.");
        return;
      }
      setSaveNote("Theme saved. The live widget will use it.");
      router.refresh();
    } catch {
      setThemeError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function onTone(id: string) {
    setTone(id);
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seq, tone: id }),
      });
      if (!res.ok) {
        setSaveError("Could not save tone.");
        return;
      }
      setSaveNote("Tone saved. The live assistant will use it.");
      router.refresh();
    } catch {
      setSaveError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function scan() {
    setScanError(null);
    if (!websiteUrl.trim()) {
      setScanError("Save a website URL first.");
      return;
    }
    const ok = window.confirm(`Scan ${websiteUrl.trim()} now?`);
    if (!ok) return;
    setScanning(true);
    try {
      await saveFields();
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seq, confirm: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        pages?: number;
        business?: ClientBusiness;
      };
      if (!res.ok) {
        setScanError(SCAN_FAIL);
        return;
      }
      if (data.business) {
        patchPad(data.business.notepad);
      }
      setSaveNote("Scan complete.");
      router.refresh();
    } catch {
      setScanError(SCAN_FAIL);
    } finally {
      setScanning(false);
    }
  }

  async function setPassword(e: FormEvent) {
    e.preventDefault();
    setPwNote(null);
    setPwError(null);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seq, password: newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwError(data.error || "Could not set that password.");
        return;
      }
      setNewPassword("");
      setPwNote("New password set. It is stored hashed.");
    } catch {
      setPwError("Could not reach the server.");
    }
  }

  const snippet = `<script src="https://sclxter.com/embed.js" data-id="${business.publicId}" async></script>`;

  const testBlocked = businessReadyForTest({
    name,
    websiteUrl,
    industry,
    contactPhone,
    contactEmail,
    contactOther,
  })
    ? null
    : TEST_AI_BLOCKED;

  return (
    <main className="mx-auto w-full min-w-0 max-w-[96rem] flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      {!admin && !live ? (
        <p className="mb-6 border border-line bg-surface px-5 py-4 text-sm leading-6 text-fg">
          This account is unpaid. Your shop data is kept. Scan, notepad, and
          Test AI still work here. The live assistant on your website stays
          off until cover is current. Pay on Billing.
        </p>
      ) : null}
      <InstructionsBanner steps={instructions} admin={admin} />
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)_minmax(0,0.9fr)]">
      <div className="order-1 min-w-0">
      <aside className="flex min-h-0 flex-col border border-line p-4 lg:min-h-[48rem] lg:p-5">
        <h2 className="text-xl font-bold tracking-tight text-fg">
          Your website&apos;s data
        </h2>
        <p className="mt-2 text-sm text-muted">{NOTEPAD_NOTICE}</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="quiet" onClick={undo}>
            Undo
          </Button>
          <Button type="button" variant="quiet" onClick={redo}>
            Redo
          </Button>
        </div>
        <Textarea
          className="mt-3 min-h-[16rem] flex-1 text-[0.9375rem] leading-6 lg:min-h-[32rem]"
          value={notepad}
          onChange={(e) => patchPad(e.target.value)}
          placeholder="Scan website to fill"
          aria-label="Your website's data"
        />
        <Button
          type="button"
          className="mt-3"
          disabled={saving}
          onClick={() => void saveFields({ notepad })}
        >
          Save notepad
        </Button>
        <p className="mt-3 text-sm text-muted">
          You can edit all of the information.
        </p>
      </aside>
      <section className="mt-8 border border-line p-4 lg:p-5">
        <h2 className="text-xl font-bold tracking-tight text-fg">
          Scan website
        </h2>
        <p className="mt-2 text-sm text-muted">
          Fetches public pages on the URL you saved and adds the text to the
          notepad. Confirm once, then it runs.
        </p>
        <Button
          type="button"
          className="mt-5 h-12 w-full text-base font-medium"
          disabled={scanning || !websiteUrl.trim()}
          onClick={() => void scan()}
        >
          {scanning ? "Scanning…" : "Scan website"}
        </Button>
        <FieldError>{scanError}</FieldError>
      </section>
      </div>

      <div className="order-3 space-y-12 lg:order-2">
        <section>
          <h1 className="text-2xl font-medium tracking-tight">
            {name || "Business"}
            {admin && typeof seq === "number" ? (
              <span className="ml-3 text-sm font-normal text-muted">
                id {seq}
              </span>
            ) : null}
          </h1>
        </section>

        {admin && (
          <section>
            <h2 className="text-xl font-medium tracking-tight">
              Email and password
            </h2>
            <p className="mt-2 text-sm text-muted">
              Signup email. Set a new password if they write in from that
              address. The live secret is hashed — nothing original is shown.
            </p>
            <p className="mt-4 text-sm">{business.ownerEmail || "—"}</p>
            <form onSubmit={setPassword} className="mt-4 max-w-md space-y-3">
              <div>
                <Label htmlFor="new-pw">New password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit">Set new password</Button>
              {pwNote && <p className="text-sm text-muted">{pwNote}</p>}
              <FieldError>{pwError}</FieldError>
            </form>
          </section>
        )}

        <form onSubmit={onSave} className="space-y-5">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourshop.example"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <Label>Contact</Label>
            <div className="space-y-3">
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone"
                aria-label="Phone"
              />
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email"
                aria-label="Contact email"
              />
              <Input
                value={contactOther}
                onChange={(e) => setContactOther(e.target.value)}
                placeholder="Other"
                aria-label="Other contact"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {saveNote && <span className="text-sm text-muted">{saveNote}</span>}
          </div>
          <FieldError>{saveError}</FieldError>
        </form>

        <section>
          <h2 className="text-xl font-medium tracking-tight">Tone</h2>
          <p className="mt-2 text-sm text-muted">
            Saved on this business. The live assistant speaks in this tone.
          </p>
          <select
            className="mt-4 h-10 w-full max-w-md border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-fg"
            value={tone}
            onChange={(e) => void onTone(e.target.value)}
            aria-label="Tone"
          >
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </section>

        <ThemePicker theme={theme} onChange={(next) => void onTheme(next)} error={themeError} />

        <section>
          <h2 className="text-xl font-medium tracking-tight">Embed Ask anything</h2>
          <p className="mt-2 text-sm text-muted">
            This snippet is this business’s assistant. Paste it before the
            closing body tag. It loads from sclxter.com.
          </p>
          <pre className="mt-4 overflow-x-auto border border-line bg-surface p-4 text-xs leading-6">
            {snippet}
          </pre>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            onClick={() => void navigator.clipboard.writeText(snippet)}
          >
            Copy snippet
          </Button>
          <EmbedGuide snippet={snippet} />
        </section>
      </div>

      <aside className="order-2 flex min-h-[22rem] flex-col gap-4 lg:sticky lg:top-8 lg:order-3 lg:h-[calc(100vh-6rem)] lg:min-h-[36rem]">
        {!admin ? (
          <div className="shrink-0 border border-line px-5 py-3">
            <a href="/contact#support" className="text-sm text-fg">
              Contact admin
            </a>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col border border-line p-5">
          <h2 className="text-xl font-medium tracking-tight">Test AI</h2>
          <p className="mt-2 text-sm text-muted">
            Same assistant visitors get, using this business’s notepad and
            tone. It will not chat until name, URL, industry, and at least one
            contact field are filled.
          </p>
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden p-4"
              style={{
                border: `1px solid ${theme.outline}`,
                borderRadius: 24,
                background: theme.primary,
                color: theme.text,
              }}
            >
              <WidgetForm
                publicId={business.publicId}
                welcome={
                  testBlocked ||
                  "Ask using the notepad and tone saved for this business."
                }
                assistantName="Assistant"
                theme={theme}
                endpoint="/api/chat/test"
                extraBody={admin && typeof seq === "number" ? { seq } : {}}
                namespace={`test:${business.publicId}`}
                blocked={testBlocked}
              />
            </div>
          </div>
          <div className="mt-4 shrink-0 border-t border-line pt-4">
            <p className="text-sm text-fg">Widget button</p>
            <div className="mt-3">
              <button
                type="button"
                aria-label="Ask anything"
                className="inline-flex h-[52px] min-w-[52px] items-center justify-center px-7 text-sm font-semibold tracking-[0.06em]"
                style={{
                  boxSizing: "border-box",
                  backgroundColor: theme.primary,
                  backgroundClip: "padding-box",
                  color: theme.text,
                  border: `2px solid ${theme.outline}`,
                  borderRadius: 20,
                  appearance: "none",
                  overflow: "visible",
                }}
                onClick={() => {
                  document.getElementById("wa-input")?.focus();
                }}
              >
                Ask anything
              </button>
            </div>
          </div>
        </div>
      </aside>
      </div>
    </main>
  );
}

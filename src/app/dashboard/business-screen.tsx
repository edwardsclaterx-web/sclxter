"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { FieldError } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, ClientBusiness } from "@/lib/types";
import { NOTEPAD_NOTICE, TONES } from "@/lib/tones";
import { TEST_AI_BLOCKED, businessReadyForTest } from "@/lib/test-ai";
import { EmbedGuide } from "./embed-guide";
import { InstructionsBanner } from "./instructions-banner";

type Convo = {
  seq: number;
  lead: boolean;
  updatedAt: string;
  createdAt: string;
  messages: ChatMessage[];
};

type LeadRow = { createdAt: string; message: string };

type Props = {
  admin: boolean;
  business: ClientBusiness;
  conversations: Convo[];
  leads: LeadRow[];
  instructions: string[];
};

type Period = "day" | "week" | "month";

function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function within(iso: string, period: Period) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const ms =
    period === "day"
      ? 24 * 60 * 60 * 1000
      : period === "week"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return now - t <= ms;
}

export function BusinessScreen({
  admin,
  business,
  conversations,
  leads,
  instructions,
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
  const [notepad, setNotepad] = useState(business.notepad);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwNote, setPwNote] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [openConvo, setOpenConvo] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [origin, setOrigin] = useState("");

  const hist = useRef<string[]>([business.notepad]);
  const histI = useRef(0);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
        business?: ClientBusiness;
      };
      if (!res.ok) {
        setScanError(data.error || "Scan failed.");
        return;
      }
      if (data.business) {
        patchPad(data.business.notepad);
      }
      router.refresh();
    } catch {
      setScanError("Could not reach the server.");
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

  const snippet = `<script src="${origin || "https://your-host"}/embed.js" data-id="${business.publicId}" async></script>`;

  const convoCount = conversations.filter((c) =>
    within(c.createdAt, period),
  ).length;
  const leadCount = leads.filter((l) => within(l.createdAt, period)).length;
  const periodLeads = leads.filter((l) => within(l.createdAt, period));

  const open = useMemo(
    () => conversations.find((c) => c.seq === openConvo) ?? null,
    [conversations, openConvo],
  );

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
    <main className="mx-auto w-full max-w-[96rem] flex-1 px-5 py-10 md:px-8">
      <InstructionsBanner steps={instructions} admin={admin} />
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)_minmax(0,0.9fr)]">
      <aside className="order-1 flex min-h-[32rem] flex-col border border-line p-5 lg:sticky lg:top-8 lg:h-[calc(100vh-6rem)] lg:max-h-[calc(100vh-6rem)]">
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
          className="mt-3 min-h-0 flex-1 text-[0.9375rem] leading-6"
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
      </aside>

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

        <section>
          <h2 className="text-xl font-medium tracking-tight">Scan data</h2>
          <p className="mt-2 text-sm text-muted">
            Fetches public pages on the URL above and adds the text to the
            notepad. Confirm once, then it runs.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-4"
            disabled={scanning || !websiteUrl.trim()}
            onClick={() => void scan()}
          >
            {scanning ? "Scanning…" : "Scan site"}
          </Button>
          <FieldError>{scanError}</FieldError>
        </section>

        <section>
          <h2 className="text-xl font-medium tracking-tight">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="mt-4 border border-dashed border-line px-4 py-8 text-sm text-muted">
              No conversations yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line border border-line">
              {conversations
                .slice()
                .sort((a, b) => a.seq - b.seq)
                .map((c) => (
                  <li key={c.seq}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-surface"
                      onClick={() =>
                        setOpenConvo((n) => (n === c.seq ? null : c.seq))
                      }
                    >
                      <span>id {c.seq}</span>
                      <span className="text-muted">
                        {formatStamp(c.updatedAt)}
                        {c.lead ? " · lead" : ""}
                      </span>
                    </button>
                    {open?.seq === c.seq && (
                      <div className="space-y-3 border-t border-line bg-surface px-4 py-4">
                        {c.messages.map((m, i) => (
                          <p key={i} className="text-sm leading-6">
                            <span className="text-xs uppercase tracking-[0.14em] text-muted">
                              {m.role === "user" ? "Visitor" : "Assistant"}
                            </span>
                            <span className="mt-1 block whitespace-pre-wrap">
                              {m.content}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-medium tracking-tight">Stats</h2>
          <div className="mt-4 flex gap-2">
            {(["day", "week", "month"] as const).map((p) => (
              <Button
                key={p}
                type="button"
                variant={period === p ? "primary" : "ghost"}
                onClick={() => setPeriod(p)}
              >
                {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-sm">
            Conversations made: {convoCount}
          </p>
          <p className="mt-2 text-sm">Potential leads: {leadCount}</p>
          {periodLeads.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No potential leads in this window. Only chats flagged as closer
              to buying appear here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {periodLeads.map((l, i) => (
                <li key={i}>
                  {formatStamp(l.createdAt)} — {l.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-medium tracking-tight">Embed Ask anything</h2>
          <p className="mt-2 text-sm text-muted">
            This snippet is this business’s assistant. Paste it before the
            closing body tag.
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
          <EmbedGuide />
        </section>
      </div>

      <aside className="order-2 flex min-h-[32rem] flex-col border border-line p-5 lg:sticky lg:top-8 lg:order-3 lg:h-[calc(100vh-6rem)] lg:max-h-[calc(100vh-6rem)]">
        <h2 className="text-xl font-medium tracking-tight">Test AI</h2>
        <p className="mt-2 text-sm text-muted">
          Same assistant visitors get, using this business’s notepad and
          tone. It will not chat until name, URL, industry, and at least one
          contact field are filled.
        </p>
        <div className="mt-4 flex min-h-[20rem] flex-1 flex-col">
          <ChatPanel
            endpoint="/api/chat/test"
            extraBody={admin && typeof seq === "number" ? { seq } : {}}
            blocked={testBlocked}
            welcome="Ask using the notepad and tone saved for this business."
            assistantName="Assistant"
            title="Test AI"
            clearable
            compact
            showLead={false}
          />
        </div>
      </aside>
      </div>
    </main>
  );
}

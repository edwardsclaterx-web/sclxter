"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { SiteHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Business, KnowledgeItem, Lead } from "@/lib/types";

type Props = {
  email: string;
  business: Business;
  knowledge: KnowledgeItem[];
  leads: Lead[];
};

export function Dashboard({ email, business, knowledge, leads }: Props) {
  const router = useRouter();
  const [biz, setBiz] = useState(business);
  const [items, setItems] = useState(knowledge);
  const [leadList, setLeadList] = useState(leads);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<script src="${origin || "https://your-sclxter-host"}/embed.js" data-id="${biz.publicId}" async></script>`;

  async function saveBusiness(e: FormEvent) {
    e.preventDefault();
    setSaveNote(null);
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: biz.name,
        websiteUrl: biz.websiteUrl,
        appearance: biz.appearance,
      }),
    });
    if (!res.ok) {
      setSaveNote("Could not save.");
      return;
    }
    setSaveNote("Saved.");
    router.refresh();
  }

  async function scan() {
    setScanning(true);
    setScanNote(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = (await res.json()) as {
        items?: KnowledgeItem[];
        error?: string;
        pages?: number;
      };
      if (!res.ok) {
        setScanNote(data.error || "Scan failed.");
        return;
      }
      setItems((prev) => [
        ...prev.filter((k) => k.source !== "scan"),
        ...(data.items ?? []),
      ]);
      setScanNote(`Kept ${data.pages} page${data.pages === 1 ? "" : "s"}. Review below.`);
      router.refresh();
    } finally {
      setScanning(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: noteTitle, body: noteBody }),
    });
    const data = (await res.json()) as { item?: KnowledgeItem; error?: string };
    if (!res.ok || !data.item) return;
    setItems((prev) => [...prev, data.item!]);
    setNoteTitle("");
    setNoteBody("");
  }

  async function saveItem(item: KnowledgeItem) {
    const res = await fetch(`/api/knowledge/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: item.title, body: item.body }),
    });
    if (!res.ok) return;
    setEditing(null);
  }

  async function removeItem(id: string) {
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((k) => k.id !== id));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function copySnippet() {
    void navigator.clipboard.writeText(snippet);
    setSaveNote("Snippet copied.");
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <>
            <span className="hidden sm:inline">{email}</span>
            <Link href="/demo">Barber demo</Link>
            <button type="button" onClick={() => void logout()} className="text-fg">
              Sign out
            </button>
          </>
        }
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-10 lg:grid-cols-[1fr_22rem] md:px-8">
        <div className="space-y-12">
          <section>
            <h1 className="text-2xl font-medium tracking-tight">Your shop</h1>
            <p className="mt-2 text-sm text-muted">
              Name, site, and how the widget looks. Visitors only see answers
              from notes and scanned pages.
            </p>
            <form onSubmit={saveBusiness} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  value={biz.name}
                  onChange={(e) => setBiz({ ...biz, name: e.target.value })}
                  placeholder="Northgate Barbers"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  value={biz.websiteUrl}
                  onChange={(e) => setBiz({ ...biz, websiteUrl: e.target.value })}
                  placeholder="/demo or https://yourshop.example"
                />
              </div>
              <div>
                <Label htmlFor="assistant">Assistant name</Label>
                <Input
                  id="assistant"
                  value={biz.appearance.assistantName}
                  onChange={(e) =>
                    setBiz({
                      ...biz,
                      appearance: {
                        ...biz.appearance,
                        assistantName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="colour">Accent colour</Label>
                <Input
                  id="colour"
                  value={biz.appearance.colour}
                  onChange={(e) =>
                    setBiz({
                      ...biz,
                      appearance: { ...biz.appearance, colour: e.target.value },
                    })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="welcome">Welcome line</Label>
                <Input
                  id="welcome"
                  value={biz.appearance.welcome}
                  onChange={(e) =>
                    setBiz({
                      ...biz,
                      appearance: { ...biz.appearance, welcome: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <Button type="submit">Save</Button>
                {saveNote && <span className="text-sm text-muted">{saveNote}</span>}
              </div>
            </form>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium tracking-tight">Website scan</h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Fetches public HTML on that address only, a few pages at a
                  time. Review, keep, or delete what it finds.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => void scan()} disabled={scanning}>
                {scanning ? "Scanning…" : "Scan site"}
              </Button>
            </div>
            {scanNote && <p className="mt-3 text-sm text-muted">{scanNote}</p>}
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-tight">Knowledge</h2>
            <p className="mt-2 text-sm text-muted">
              Typed notes work before you scan. Hours, prices, “always mention cash”.
            </p>
            <form onSubmit={addNote} className="mt-5 space-y-3">
              <Input
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder="The fact"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                required
              />
              <Button type="submit" variant="ghost">
                Add note
              </Button>
            </form>
            <ul className="mt-6 space-y-4">
              {items.length === 0 && (
                <li className="text-sm text-muted">No notes yet.</li>
              )}
              {items.map((item) => (
                <li key={item.id} className="border border-line p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {item.source === "scan" ? "Scan" : "Note"}
                    </p>
                    <div className="flex gap-3 text-xs text-muted">
                      <button type="button" onClick={() => setEditing(item.id)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => void removeItem(item.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {editing === item.id ? (
                    <div className="mt-3 space-y-2">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((k) =>
                              k.id === item.id ? { ...k, title: e.target.value } : k,
                            ),
                          )
                        }
                      />
                      <Textarea
                        value={item.body}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((k) =>
                              k.id === item.id ? { ...k, body: e.target.value } : k,
                            ),
                          )
                        }
                      />
                      <Button type="button" onClick={() => void saveItem(item)}>
                        Save note
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="mt-2 text-sm">{item.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {item.body}
                      </p>
                      {item.url && (
                        <p className="mt-2 truncate text-xs text-muted">{item.url}</p>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-tight">Widget snippet</h2>
            <p className="mt-2 text-sm text-muted">
              Paste before the closing body tag. Status:{" "}
              {biz.widgetConnectedAt ? "connected" : "waiting for first load"}
            </p>
            <pre className="mt-4 overflow-x-auto border border-line bg-surface p-4 text-xs leading-6">
              {snippet}
            </pre>
            <Button type="button" variant="ghost" className="mt-3" onClick={copySnippet}>
              Copy snippet
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-tight">Leads</h2>
            <ul className="mt-4 space-y-3">
              {leadList.length === 0 && (
                <li className="text-sm text-muted">No callbacks yet.</li>
              )}
              {leadList.map((lead) => (
                <li key={lead.id} className="border border-line p-4 text-sm">
                  <p>
                    {lead.name}
                    {lead.phone ? ` · ${lead.phone}` : ""}
                    {lead.email ? ` · ${lead.email}` : ""}
                  </p>
                  {lead.message && (
                    <p className="mt-2 text-muted">{lead.message}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {new Date(lead.createdAt).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="border border-line p-5 lg:sticky lg:top-8 lg:h-[calc(100vh-6rem)]">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Test chat
          </p>
          <p className="mt-2 mb-4 text-sm text-muted">
            Same path visitors use. Ask anything.
          </p>
          <ChatPanel
            endpoint="/api/chat"
            welcome={biz.appearance.welcome}
            assistantName={biz.appearance.assistantName}
            compact
            onLeadSaved={() => {
              void fetch("/api/me")
                .then((r) => r.json())
                .then((d: { leads?: Lead[] }) => {
                  if (d.leads) setLeadList(d.leads);
                });
            }}
          />
        </aside>
      </main>
    </div>
  );
}

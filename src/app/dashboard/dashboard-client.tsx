"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { FieldError, SiteHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Business, KnowledgeItem } from "@/lib/types";

type Props = {
  email: string;
  business: Business;
  notes: KnowledgeItem[];
};

export function Dashboard({ email, business, notes }: Props) {
  const router = useRouter();
  const [name, setName] = useState(business.name);
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState(notes);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function saveBusiness(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveNote(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, websiteUrl }),
      });
      if (!res.ok) {
        setSaveError("Could not save the business.");
        return;
      }
      setSaveNote("Saved.");
      router.refresh();
    } catch {
      setSaveError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    setNoteError(null);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: noteTitle, body: noteBody }),
      });
      const data = (await res.json()) as { item?: KnowledgeItem; error?: string };
      if (!res.ok || !data.item) {
        setNoteError(data.error || "Could not add that note.");
        return;
      }
      setItems((prev) => [...prev, data.item!]);
      setNoteTitle("");
      setNoteBody("");
      router.refresh();
    } catch {
      setNoteError("Could not reach the server.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(item: KnowledgeItem) {
    setEditing(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      const data = (await res.json()) as { item?: KnowledgeItem; error?: string };
      if (!res.ok || !data.item) {
        setEditError(data.error || "Could not save that note.");
        return;
      }
      setItems((prev) => prev.map((k) => (k.id === id ? data.item! : k)));
      setEditing(null);
      router.refresh();
    } catch {
      setEditError("Could not reach the server.");
    }
  }

  async function removeItem(id: string) {
    setEditError(null);
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setEditError("Could not delete that note.");
        return;
      }
      setItems((prev) => prev.filter((k) => k.id !== id));
      if (editing === id) setEditing(null);
      router.refresh();
    } catch {
      setEditError("Could not reach the server.");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-muted">
            <span className="hidden sm:inline">{email}</span>
            <button type="button" onClick={() => void logout()} className="text-fg">
              Sign out
            </button>
          </nav>
        }
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] md:px-8">
        <div className="space-y-12">
          <section>
            <h1 className="text-2xl font-medium tracking-tight">Your business</h1>
            <p className="mt-2 text-sm text-muted">
              Name and website. The assistant uses the notes you add below.
            </p>
            <form onSubmit={saveBusiness} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Northgate Barbers"
                  autoComplete="organization"
                />
              </div>
              <div>
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourshop.example"
                  autoComplete="url"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                {saveNote && <span className="text-sm text-muted">{saveNote}</span>}
              </div>
              <FieldError>{saveError}</FieldError>
            </form>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-tight">Notes</h2>
            <p className="mt-2 text-sm text-muted">
              Hours, prices, services, and extra facts the assistant should
              learn. These stay on the server.
            </p>
            <form onSubmit={addNote} className="mt-5 space-y-3">
              <Input
                placeholder="Title — e.g. Saturday hours"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder="The fact — e.g. Open 9am–4pm Saturday. Walk-ins until 3:30."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                required
              />
              <Button type="submit" variant="ghost" disabled={adding}>
                {adding ? "Adding…" : "Add note"}
              </Button>
              <FieldError>{noteError}</FieldError>
            </form>
            <ul className="mt-6 space-y-4">
              {items.length === 0 && (
                <li className="border border-dashed border-line px-4 py-8 text-sm text-muted">
                  No notes yet. Add hours, prices, services, or anything the
                  assistant should know.
                </li>
              )}
              {items.map((item) => (
                <li key={item.id} className="border border-line p-4">
                  <div className="flex items-center justify-end gap-3 text-xs text-muted">
                    <button type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void removeItem(item.id)}>
                      Delete
                    </button>
                  </div>
                  {editing === item.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        aria-label="Note title"
                      />
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        aria-label="Note body"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => void saveEdit(item.id)}>
                          Save note
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <FieldError>{editError}</FieldError>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm">{item.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {item.body}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {editing === null && <FieldError>{editError}</FieldError>}
          </section>
        </div>

        <aside className="flex min-h-[28rem] flex-col border border-line p-5 lg:sticky lg:top-8 lg:h-[calc(100vh-6rem)]">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Test chat
          </p>
          <p className="mt-2 mb-4 text-sm text-muted">
            Answers from your notes only.
          </p>
          <div className="min-h-0 flex-1">
            <ChatPanel
              endpoint="/api/chat"
              welcome="Ask about hours, prices, or a service you wrote in a note."
              assistantName="Assistant"
              title="Ask anything"
              clearable
              compact
              showLead={false}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}

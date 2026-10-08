"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Row = {
  seq: number;
  name: string;
  websiteUrl: string;
  industry: string;
  contactPhone: string;
  contactEmail: string;
  contactOther: string;
  ownerEmail: string;
};

function contactLine(r: Row) {
  return [r.contactPhone, r.contactEmail, r.contactOther]
    .filter(Boolean)
    .join(" · ");
}

export function BusinessesList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"id" | "name">("id");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows;
    if (needle) {
      list = rows.filter((r) =>
        [
          String(r.seq),
          r.name,
          r.websiteUrl,
          r.industry,
          r.contactPhone,
          r.contactEmail,
          r.contactOther,
          r.ownerEmail,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    const copy = [...list];
    if (sort === "name") {
      copy.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "en", {
          sensitivity: "base",
        }),
      );
    } else {
      copy.sort((a, b) => a.seq - b.seq);
    }
    return copy;
  }, [rows, q, sort]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <h1 className="text-2xl font-medium tracking-tight">Businesses</h1>
      <p className="mt-2 text-sm text-muted">
        Search and open a business. Sequential ids are for you only.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="max-w-md"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value === "name" ? "name" : "id")}
            className="h-10 border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-fg"
          >
            <option value="id">id</option>
            <option value="name">alphabetical</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 border border-dashed border-line px-4 py-10 text-sm text-muted">
          No businesses yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
                <th className="py-3 pr-4 font-normal">id</th>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">URL</th>
                <th className="py-3 pr-4 font-normal">Industry</th>
                <th className="py-3 pr-4 font-normal">Contact</th>
                <th className="py-3 pr-4 font-normal">Email</th>
                <th className="py-3 font-normal">Password</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.seq} className="border-b border-line hover:bg-surface">
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/b/${r.seq}`} className="text-fg">
                      {r.seq}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/b/${r.seq}`} className="text-fg">
                      {r.name || "Untitled"}
                    </Link>
                  </td>
                  <td className="max-w-[12rem] truncate py-3 pr-4 text-muted">
                    {r.websiteUrl || "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted">{r.industry || "—"}</td>
                  <td className="max-w-[14rem] truncate py-3 pr-4 text-muted">
                    {contactLine(r) || "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted">{r.ownerEmail || "—"}</td>
                  <td className="py-3 text-muted">Set on the business page</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

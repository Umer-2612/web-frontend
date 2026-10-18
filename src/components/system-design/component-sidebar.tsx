"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";

import { Input } from "@/components/ui/input";
import { CATALOG, DRAG_MIME, GROUPS, type ComponentInfo, type ComponentType } from "@/lib/system-design/catalog";

function SidebarItem({ info, disabled, onAdd }: { info: ComponentInfo; disabled: boolean; onAdd: (type: ComponentType) => void }) {
  const handleDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(DRAG_MIME, info.type);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <button
      type="button"
      draggable={!disabled}
      onDragStart={handleDragStart}
      onClick={() => onAdd(info.type)}
      disabled={disabled}
      title={disabled ? `${info.label} is already on the board` : info.description}
      className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-zinc-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none enabled:cursor-grab enabled:active:cursor-grabbing disabled:opacity-40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
        {info.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.icon} alt="" draggable={false} className="size-7 rounded" />
        ) : (
          <Users className="size-5 text-zinc-500" aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{info.label}</span>
      </span>
    </button>
  );
}

/** Every AWS building block the candidate can use. Drag onto the board, or click to drop one in. */
export function ComponentSidebar({ present, onAdd }: { present: Set<ComponentType>; onAdd: (type: ComponentType) => void }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((group) => ({
      ...group,
      items: CATALOG.filter((c) => c.group === group.id && (!q || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components" aria-label="Search components" className="h-8 pl-8 text-sm" />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {groups.length === 0 && <p className="px-1 text-sm text-zinc-500">Nothing matches &ldquo;{query}&rdquo;.</p>}
        {groups.map((group) => (
          <section key={group.id} aria-label={group.label}>
            <h3 className="mb-1 px-2 text-xs font-semibold text-zinc-500">{group.label}</h3>
            <div className="space-y-0.5">
              {group.items.map((info) => (
                <SidebarItem key={info.type} info={info} disabled={info.type === "users" && present.has("users")} onAdd={onAdd} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

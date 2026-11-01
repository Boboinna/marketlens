"use client";
import { useState } from "react";
import { QUICK_ADD } from "@/config/facts";
import { Button } from "../ui/button";

const control = "h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base outline-none sm:h-11 sm:text-[15px]";

/** Lets sellers add any detail that matters for their product. Nothing is added unless they choose it. */
export function AddDetail({ existing, onAdd, embedded }: { existing: string[]; onAdd: (label: string, value: string) => void; embedded?: boolean }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const have = new Set(existing.map((e) => e.trim().toLowerCase()));
  const submit = () => {
    if (!label.trim()) return;
    onAdd(label, value);
    setLabel("");
    setValue("");
  };
  return (
    <section aria-label="Add a detail" className={embedded ? "" : "mt-4 rounded-2xl border border-line bg-s1 p-5 sm:p-6"}>
      <h2 className="font-semibold">Add a detail</h2>
      <p className="mt-1 text-sm text-mu">Anything buyers should know that isn’t listed above.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_ADD.filter((q) => !have.has(q.toLowerCase())).map((q) => (
          <button key={q} onClick={() => onAdd(q, "")} className="min-h-9 rounded-full border border-line bg-s2 px-3 py-1.5 text-sm hover:border-tx">+ {q}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <input aria-label="New detail name" placeholder="Name (e.g. Scent)" value={label} onChange={(e) => setLabel(e.target.value)} className={control} />
        <input aria-label="New detail value" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className={control} />
        <Button variant="ghost" className="!h-12 sm:!h-11" disabled={!label.trim()} onClick={submit}>Add</Button>
      </div>
    </section>
  );
}

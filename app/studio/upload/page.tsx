"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { QuotaCard } from "@/components/feedback/quota-card";
import { Button } from "@/components/ui/button";
import { BgThumb } from "@/components/studio/background-picker";
import { bgById } from "@/config/backgrounds";
import { RATIOS, styleById } from "@/config/image-styles";
import { TEMPLATES, type Template } from "@/config/templates";
import { useQuota } from "@/hooks/use-quota";
import { api } from "@/lib/client/api";
import { clearDraft, loadDraft, resumePath, type Draft } from "@/lib/client/drafts";
import { resizeImage } from "@/lib/client/image-resize";
import { loadMyTemplates } from "@/lib/client/templates";
import { progress } from "@/lib/toast";
import { addAsked } from "@/lib/truthlock/status";
import { useStudio } from "@/store/studio";

type Mode = "scratch" | "template";

export default function UploadPage() {
  const router = useRouter();
  const { set, reset, hydrate } = useStudio();
  const quota = useQuota();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>();
  const [mode, setMode] = useState<Mode>("scratch");
  const [tplId, setTplId] = useState("");
  const [mine, setMine] = useState<Template[]>([]);
  const exhausted = !!quota && quota.used >= quota.limit;

  useEffect(() => { loadDraft().then((d) => d?.analysis && setDraft(d)); setMine(loadMyTemplates()); }, []);
  const tpl = useMemo(() => (mode === "template" ? [...TEMPLATES, ...mine].find((t) => t.id === tplId) : undefined), [mode, tplId, mine]);

  const handle = useCallback(async (file: File) => {
    setBusy(true);
    const id = progress.start("Reading your photo…");
    try {
      const photo = await resizeImage(file);
      reset();
      set({ photo });
      const r = await api.analyze(photo.dataUrl);
      // A template only presets settings and adds blank questions. The photo is always read first.
      set({
        runId: r.runId, analysis: r.analysis, quota: r.quota,
        facts: tpl ? addAsked(r.facts, tpl.ask) : r.facts,
        ...(tpl ? { vo: { ...tpl.visual, notes: "" }, wording: tpl.tone } : {}),
      });
      progress.ok(id, "Photo read", "Check the details next.");
      router.push("/studio/details");
    } catch (e) {
      progress.fail(id, e, () => handle(file));
      api.quota().then((q) => set({ quota: q.quota })).catch(() => {});
    } finally {
      setBusy(false);
    }
  }, [reset, set, router, tpl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] }, maxFiles: 1, noClick: true, disabled: busy || exhausted,
    onDrop: (f) => f[0] && handle(f[0]),
  });

  const opt = (m: Mode, title: string, sub: string) => (
    <button
      type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
      className={`rounded-xl border p-4 text-left ${mode === m ? "border-tx bg-s2" : "border-line bg-s1 hover:border-[#3a434e]"}`}
    ><b className="block text-[15px]">{title}</b><span className="mt-0.5 block text-[13px] text-mu">{sub}</span></button>
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with one product photo</h1>
      <p className="mt-2 text-mu">We read what’s visible, ask you about the rest, then write the listing and make your images.</p>

      {draft && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-s1 p-4">
          <p className="flex-1 text-sm">You have an unfinished product.</p>
          <Button variant="ghost" className="!h-10" onClick={() => { void clearDraft(); setDraft(undefined); }}>Discard</Button>
          <Button className="!h-10" onClick={() => { hydrate(draft); router.push(resumePath(draft)); }}>Continue</Button>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-s1 p-5 sm:p-6" aria-label="How to start">
        <h2 className="font-semibold">How do you want to start?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {opt("scratch", "Start from scratch", "Every setting starts at its default.")}
          {opt("template", "Start from a template", "Preset image settings and extra questions.")}
        </div>
        {mode === "template" && (
          <div className="mt-4">
            <label className="block text-sm text-mu">Template
              <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-[15px] text-tx outline-none">
                <option value="">Choose a template…</option>
                <optgroup label="Built in">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>
                {mine.length > 0 && <optgroup label="Your templates">{mine.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>}
              </select>
            </label>
            {tpl && (
              <div className="mt-3 space-y-2 text-[13px] text-mu">
                <div className="flex flex-wrap items-center gap-2"><span className="w-14">Sets</span>
                  <Chip>{tpl.visual.ratio} {RATIOS[tpl.visual.ratio].label}</Chip><Chip>{styleById(tpl.visual.style).label}</Chip>
                  <Chip><BgThumb bg={bgById(tpl.visual.bg)} className="size-4" />{bgById(tpl.visual.bg).label}</Chip>
                </div>
                <div className="flex flex-wrap items-center gap-2"><span className="w-14">Asks</span>
                  {tpl.ask.length ? tpl.ask.map((a) => <Chip key={a} warm>{a}</Chip>) : <span>nothing extra</span>}</div>
                {tpl.tone && <div className="flex flex-wrap items-center gap-2"><span className="w-14">Wording</span><Chip>{tpl.tone}</Chip></div>}
              </div>
            )}
            <p className="mt-3 text-xs text-mu">Templates never add facts or images. Your photo is still read first, and anything a template asks stays blank until you answer.</p>
          </div>
        )}
      </section>

      {exhausted ? (
        <div className="mt-6"><QuotaCard limit={quota!.limit} /></div>
      ) : (
        <div
          {...getRootProps()}
          className={`mt-6 flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed p-6 text-center sm:p-8 ${isDragActive ? "border-tx bg-s2" : "border-[#3a434e] bg-s1"}`}
        >
          <input {...getInputProps()} />
          <h2 className="text-lg font-semibold">Photograph your product</h2>
          <p className="text-sm text-mu">Whole product in frame, even light, plain background.</p>
          <Button full disabled={busy || (mode === "template" && !tpl)} onClick={open}>{busy ? "Reading…" : "Choose photo"}</Button>
          {mode === "template" && !tpl && <p className="text-xs text-mu">Choose a template first, or switch to Start from scratch.</p>}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-mu">Photos are processed by Meta’s AI models. Your listings are saved only on this device.</p>
    </div>
  );
}

function Chip({ children, warm }: { children: React.ReactNode; warm?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${warm ? "border-unk/30 bg-unk/10 text-unk" : "border-line text-mu"}`}>{children}</span>;
}

"use client";
import { toast } from "sonner";

export const notify = {
  ok: (title: string, description?: string) => toast.success(title, { description }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  warn: (title: string, description?: string) => toast.warning(title, { description }),
};

/** One toast per action: it starts as "loading", then turns into success or error. */
export const progress = {
  start: (message: string) => toast.loading(message),
  ok: (id: string | number, title: string, description?: string) => toast.success(title, { id, description }),
  fail: (id: string | number, e: unknown, retry?: () => void) => {
    const err = e as { message?: string };
    toast.error("Something went wrong", {
      id, description: err.message ?? "Try again.",
      action: retry ? { label: "Retry", onClick: retry } : undefined,
    });
  },
};
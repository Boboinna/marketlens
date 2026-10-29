"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-mu">Your saved listings are safe. Try again, or reload the page.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { saveLegalPage, type LegalActionState } from "@/app/actions/legal";

const initial: LegalActionState = {};

export function LegalForm({
  slug,
  title,
  body,
}: {
  slug: "privacy" | "terms" | "delete";
  title: string;
  body: string;
}) {
  const [state, action, pending] = useActionState(saveLegalPage, initial);

  return (
    <form action={action} className="grid gap-4 rounded-3xl border border-line bg-paper-raised p-4 sm:p-6">
      <input type="hidden" name="slug" value={slug} />
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${slug}-title`}>
        Title
        <input
          id={`${slug}-title`}
          name="title"
          required
          maxLength={120}
          defaultValue={title}
          className="rounded-2xl border border-line bg-paper px-4 py-3 font-normal text-ink"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${slug}-body`}>
        Page text
        <textarea
          id={`${slug}-body`}
          name="body"
          required
          rows={18}
          maxLength={20000}
          defaultValue={body}
          className="min-h-80 rounded-2xl border border-line bg-paper px-4 py-3 font-normal leading-7 text-ink"
        />
      </label>
      <p className="text-sm text-ink-soft">Blank lines stay as separate paragraphs on the website.</p>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}

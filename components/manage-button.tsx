"use client";

import { useActionState } from "react";
import { manageRecord, type DeskActionState } from "@/app/actions/desk";

const initial: DeskActionState = {};

export function ManageButton({
  id,
  intent,
  back,
  label,
  confirm,
}: {
  id: string;
  intent: "remove-review" | "remove-reading" | "remove-study" | "study-public" | "study-private";
  back: string;
  label: string;
  confirm?: string;
}) {
  const [state, action, pending] = useActionState(manageRecord, initial);
  const danger = intent.startsWith("remove");

  return (
    <form
      action={action}
      className="grid justify-items-start gap-2"
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="back" value={back} />
      {state.error ? <p className="max-w-sm text-sm text-clay">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={
          danger
            ? "rounded-full border border-clay px-3 py-1.5 text-sm font-semibold text-clay hover:bg-clay hover:text-white disabled:opacity-60"
            : "rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-lake-deep hover:border-lake disabled:opacity-60"
        }
      >
        {pending ? "Working…" : label}
      </button>
    </form>
  );
}

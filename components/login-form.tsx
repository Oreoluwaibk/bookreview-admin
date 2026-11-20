"use client";

import { useActionState } from "react";
import { signIn, type DeskActionState } from "@/app/actions/desk";

const initial: DeskActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-semibold" htmlFor="password">
        Desk password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-2xl border border-line bg-paper px-4 py-3 font-normal text-ink"
        />
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
      >
        {pending ? "Opening…" : "Open the desk"}
      </button>
    </form>
  );
}

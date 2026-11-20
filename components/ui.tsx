import Image from "next/image";
import Link from "next/link";

function allowedImage(src: string) {
  try {
    const host = new URL(src).hostname;
    return host === "covers.openlibrary.org" || host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function PageIntro({
  kicker,
  title,
  text,
}: {
  kicker?: string;
  title: string;
  text: string;
}) {
  return (
    <header className="max-w-2xl">
      {kicker ? <p className="text-sm font-semibold tracking-wide text-clay">{kicker}</p> : null}
      <h1 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 leading-7 text-ink-soft">{text}</p>
    </header>
  );
}

export function Notice({ notice }: { notice?: string }) {
  if (notice === "removed") {
    return <p className="rounded-2xl bg-lake-soft px-4 py-3 text-sm text-lake-deep">Removed from the shelf.</p>;
  }

  if (notice === "updated") {
    return <p className="rounded-2xl bg-lake-soft px-4 py-3 text-sm text-lake-deep">Saved.</p>;
  }

  return null;
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="rounded-2xl border border-clay/30 bg-paper-raised px-4 py-3 text-sm text-clay">{message}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-3xl border border-dashed border-line bg-paper-raised px-5 py-8 text-ink-soft">{children}</p>;
}

export function SearchForm({
  path,
  query,
  placeholder,
  hidden,
}: {
  path: string;
  query: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={path} className="flex min-w-0 flex-1 gap-2">
      {Object.entries(hidden ?? {}).map(([key, value]) => (value ? <input key={key} type="hidden" name={key} value={value} /> : null))}
      <label className="sr-only" htmlFor={`${path}-q`}>
        Search
      </label>
      <input
        id={`${path}-q`}
        name="q"
        defaultValue={query}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-line bg-paper-raised px-4 py-2.5 text-ink placeholder:text-ink-soft"
      />
      <button type="submit" className="rounded-full bg-lake px-4 py-2.5 font-semibold text-white hover:bg-lake-deep">
        Search
      </button>
    </form>
  );
}

export function ChoiceLinks({
  path,
  name,
  current,
  options,
  keep,
}: {
  path: string;
  name: string;
  current: string;
  options: { value: string; label: string }[];
  keep?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(keep ?? {})) {
          if (value) {
            params.set(key, value);
          }
        }
        if (option.value) {
          params.set(name, option.value);
        }
        const href = params.size > 0 ? `${path}?${params.toString()}` : path;
        const active = current === option.value;
        return (
          <Link
            key={option.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-lake px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm font-semibold text-ink hover:border-lake"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Cover({ title, src }: { title: string; src: string | null }) {
  if (!src || !allowedImage(src)) {
    return (
      <span className="flex h-24 w-16 shrink-0 items-end rounded-lg bg-lake-deep p-1.5 font-serif text-[11px] leading-4 text-paper">
        {title.slice(0, 42)}
      </span>
    );
  }

  return <Image src={src} alt="" width={64} height={96} className="h-24 w-16 shrink-0 rounded-lg object-cover" />;
}

export function Avatar({ name, src, size = "md" }: { name: string; src: string | null; size?: "md" | "lg" }) {
  const className = size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (!src || !allowedImage(src)) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-lake-soft font-serif text-lake-deep ${className}`}>
        {initials || "R"}
      </span>
    );
  }

  return <Image src={src} alt="" width={64} height={64} className={`shrink-0 rounded-full object-cover ${className}`} />;
}

export function Meter({ rows }: { rows: { label: string; count: number }[] }) {
  const peak = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{row.label}</span>
            <span className="text-ink-soft">{row.count}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-lake-soft">
            <div className="h-2 rounded-full bg-lake" style={{ width: `${Math.round((row.count / peak) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

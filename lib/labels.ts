export const readingStatus: Record<string, string> = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  stopped: "Stopped",
};

export const readingFormat: Record<string, string> = {
  print: "Print",
  ebook: "Ebook",
  audio: "Audio",
};

export const copySource: Record<string, string> = {
  bought: "Bought",
  library: "Library",
  advance: "Advance",
};

export const studyTheme: Record<string, string> = {
  book: "Book review",
  topic: "Topic review",
  character: "Character review",
  other: "Other",
};

export function label(map: Record<string, string>, key: string) {
  return map[key] || key || "—";
}

export function authorsLine(authors: string[]) {
  const names = authors.filter(Boolean);
  return names.length > 0 ? names.join(", ") : "Unknown author";
}

export function scopeLabel(scope: string, chapter: string | null) {
  return scope === "chapter" ? `Chapter: ${chapter || "Untitled"}` : "Whole book";
}

export function readerBookHref(workKey: string) {
  const origin = (process.env.NEXT_PUBLIC_READER_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  return `${origin}/books/${encodeURIComponent(workKey)}`;
}

export function catalogHref(workKey: string) {
  return `https://openlibrary.org/works/${encodeURIComponent(workKey)}`;
}

export function formatWhen(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function clip(text: string, max = 220) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function countWord(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

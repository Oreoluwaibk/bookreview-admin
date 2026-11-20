import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyCard } from "@/components/records";
import { ChoiceLinks, Empty, ErrorNote, Notice, PageIntro, SearchForm } from "@/components/ui";
import { loadStudies } from "@/lib/data";

export const metadata: Metadata = {
  title: "Studies",
};

export default function StudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; theme?: string; visibility?: string; notice?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening studies…</p>}>
      <StudiesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StudiesContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; theme?: string; visibility?: string; notice?: string }>;
}) {
  const { q = "", theme = "", visibility = "", notice } = await searchParams;
  const query = q.trim();
  const chosenTheme = ["book", "topic", "character", "other"].includes(theme) ? theme : "";
  const chosenVisibility = visibility === "public" || visibility === "private" ? visibility : "";
  const result = await loadStudies(query, chosenTheme, chosenVisibility);
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro
        kicker="Scripture"
        title="Studies"
        text="Bible studies are a book, a topic, a character, or another theme. A public study is shared on that subject. A private one stays with the reader. You can change that, or remove the study."
      />
      <Notice notice={notice} />
      <SearchForm
        path="/studies"
        query={query}
        placeholder="Search a subject, reader, or lesson"
        hidden={{ theme: chosenTheme, visibility: chosenVisibility }}
      />
      <ChoiceLinks
        path="/studies"
        name="theme"
        current={chosenTheme}
        keep={{ q: query, visibility: chosenVisibility }}
        options={[
          { value: "", label: "All themes" },
          { value: "book", label: "Book" },
          { value: "topic", label: "Topic" },
          { value: "character", label: "Character" },
          { value: "other", label: "Other" },
        ]}
      />
      <ChoiceLinks
        path="/studies"
        name="visibility"
        current={chosenVisibility}
        keep={{ q: query, theme: chosenTheme }}
        options={[
          { value: "", label: "Public and private" },
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ]}
      />
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>{query || chosenTheme || chosenVisibility ? "Nothing matches that search." : "No studies yet."}</Empty>
      ) : (
        <div className="grid gap-3">
          {result.data.map((study) => (
            <StudyCard key={study.id} study={study} back="/studies" />
          ))}
        </div>
      )}
    </>
  );
}

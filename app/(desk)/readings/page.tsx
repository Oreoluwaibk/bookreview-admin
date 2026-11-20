import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadingCard } from "@/components/records";
import { ChoiceLinks, Empty, ErrorNote, Notice, PageIntro, SearchForm } from "@/components/ui";
import { loadReadings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Readings",
};

export default function ReadingsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; notice?: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening readings…</p>}>
      <ReadingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReadingsContent({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; notice?: string }> }) {
  const { q = "", status = "", notice } = await searchParams;
  const query = q.trim();
  const chosen = ["want", "reading", "finished", "stopped"].includes(status) ? status : "";
  const result = await loadReadings(query, chosen);
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro
        kicker="Shelves"
        title="Readings"
        text="Each reading keeps a status, a format, progress, and whether the copy was bought, borrowed, or an advance."
      />
      <Notice notice={notice} />
      <div className="flex flex-col gap-3">
        <SearchForm path="/readings" query={query} placeholder="Search a title, author, or reader" hidden={{ status: chosen }} />
        <ChoiceLinks
          path="/readings"
          name="status"
          current={chosen}
          keep={{ q: query }}
          options={[
            { value: "", label: "All" },
            { value: "want", label: "Want to read" },
            { value: "reading", label: "Reading" },
            { value: "finished", label: "Finished" },
            { value: "stopped", label: "Stopped" },
          ]}
        />
      </div>
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>{query || chosen ? "Nothing matches that search." : "No readings yet."}</Empty>
      ) : (
        <div className="grid gap-3">
          {result.data.map((reading) => (
            <ReadingCard key={reading.id} reading={reading} back="/readings" />
          ))}
        </div>
      )}
    </>
  );
}

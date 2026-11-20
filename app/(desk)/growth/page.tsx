import type { Metadata } from "next";
import { Suspense } from "react";
import { GrowthCard } from "@/components/records";
import { Empty, ErrorNote, PageIntro } from "@/components/ui";
import { loadGrowth } from "@/lib/data";

export const metadata: Metadata = {
  title: "Growth",
};

export default function GrowthPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening growth notes…</p>}>
      <GrowthContent />
    </Suspense>
  );
}

async function GrowthContent() {
  const result = await loadGrowth();
  if (!result.configured) {
    return null;
  }

  return (
    <>
      <PageIntro
        kicker="What the shelf can already say"
        title="Growth"
        text="A growth note is written from finished books, studies, and reviews. It names what the reader should be able to explain, do, and become."
      />
      {result.error ? <ErrorNote message={result.error} /> : null}
      {result.data.length === 0 ? (
        <Empty>No growth notes yet. One is saved when a reader opens their profile after finishing a book, keeping a study, or publishing a review.</Empty>
      ) : (
        <div className="grid gap-3">
          {result.data.map((growth) => (
            <GrowthCard key={growth.userId} growth={growth} />
          ))}
        </div>
      )}
    </>
  );
}

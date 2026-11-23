import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Legal",
};

const pages = [
  {
    href: "/legal/privacy",
    title: "Privacy",
    text: "What the shelf keeps, what a reader publishes, and what the desk can see.",
  },
  {
    href: "/legal/terms",
    title: "Terms of use",
    text: "How the website is used, what a public review means, and what can be removed.",
  },
  {
    href: "/legal/delete",
    title: "Delete account",
    text: "What is removed with an account, what stays in the catalog, and how a reader asks.",
  },
];

export default function LegalPage() {
  return (
    <>
      <PageIntro
        kicker="The website"
        title="Privacy, terms, and deletion"
        text="These pages are linked from the footer of the reader site. Edit one here, save it, and the website shows the new text."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {pages.map((page) => (
          <li key={page.href}>
            <Link href={page.href} className="block rounded-3xl border border-line bg-paper-raised p-5 hover:border-lake">
              <h2 className="font-serif text-2xl">{page.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{page.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

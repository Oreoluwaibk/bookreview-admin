"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/readers", label: "Readers" },
  { href: "/books", label: "Books" },
  { href: "/readings", label: "Readings" },
  { href: "/reviews", label: "Reviews" },
  { href: "/studies", label: "Studies" },
  { href: "/growth", label: "Growth" },
  { href: "/legal", label: "Legal" },
];

export function DeskNav({ tone }: { tone: "dark" | "light" }) {
  const pathname = usePathname();

  return (
    <nav className={tone === "dark" ? "mt-8 grid gap-1" : "flex gap-2 overflow-x-auto px-4 pb-3"}>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const className =
          tone === "dark"
            ? active
              ? "rounded-full bg-paper px-3 py-2 text-sm font-semibold text-lake-deep"
              : "rounded-full px-3 py-2 text-sm font-semibold text-paper/80 hover:bg-white/10"
            : active
              ? "shrink-0 rounded-full bg-lake px-3 py-1.5 text-sm font-semibold text-white"
              : "shrink-0 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink";

        return (
          <Link key={link.href} href={link.href} className={className} aria-current={active ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

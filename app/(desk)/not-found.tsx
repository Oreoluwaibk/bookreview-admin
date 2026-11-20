import Link from "next/link";

export default function NotFound() {
  return (
    <section className="max-w-xl">
      <h1 className="font-serif text-4xl">That record is not on the desk.</h1>
      <Link href="/" className="mt-4 inline-block font-semibold text-lake-deep">
        Back to the overview
      </Link>
    </section>
  );
}

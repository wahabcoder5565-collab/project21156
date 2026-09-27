import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900">
          We could not find that page
        </h1>
        <p className="mt-2.5 text-sm text-ink-600">
          The poll may have been unpublished, or the link may be wrong.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Link href="/polls" className="btn btn-primary">
            Browse live polls
          </Link>
          <Link href="/" className="btn btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

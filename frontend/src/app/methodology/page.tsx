import Link from "next/link"

export default function MethodologyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-[#18211d]">
      <Link href="/" className="text-sm font-medium text-[#2563eb]">← Return to map</Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight text-[#18211d]">Methodology</h1>
      <p className="mt-5 leading-8 text-[#66747d]">
        CharityMap will display publicly reported funding records. It will distinguish announced, committed, disbursed and spent amounts. Every public event must link to its original source and state the precision of its location.
      </p>
      <h2 className="mt-10 text-2xl font-semibold text-[#18211d]">Current status</h2>
      <p className="mt-4 leading-8 text-[#66747d]">
        This repository is at foundation stage. The homepage uses clearly labelled demonstration records until a validated data source is connected.
      </p>
    </main>
  )
}

import Link from "next/link"

export default function MethodologyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-[#dceae3]">
      <Link href="/" className="text-sm text-emerald-300">← Return to map</Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white">Methodology</h1>
      <p className="mt-5 leading-8 text-[#a9bbb3]">
        CharityMap will display publicly reported funding records. It will distinguish announced, committed, disbursed and spent amounts. Every public event must link to its original source and state the precision of its location.
      </p>
      <h2 className="mt-10 text-2xl font-semibold text-white">Current status</h2>
      <p className="mt-4 leading-8 text-[#a9bbb3]">
        This repository is at foundation stage. The homepage uses clearly labelled demonstration records until a validated data source is connected.
      </p>
    </main>
  )
}

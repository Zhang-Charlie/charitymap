import { DashboardShell } from "@/components/dashboard-shell"
import { getPublicFundingEvents } from "@/lib/funding-events"
import { connection } from "next/server"

export default async function Home() {
  await connection()
  const fundingData = await getPublicFundingEvents()

  return <DashboardShell {...fundingData} />
}

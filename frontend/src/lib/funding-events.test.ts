import { afterEach, describe, expect, it } from "vitest"
import { getPublicFundingEvents } from "@/lib/funding-events"

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
})

describe("getPublicFundingEvents", () => {
  it("returns an explicit state when public data is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    await expect(getPublicFundingEvents()).resolves.toEqual({
      events: [],
      state: "unconfigured",
      message: "Public funding data has not been configured for this environment."
    })
  })
})

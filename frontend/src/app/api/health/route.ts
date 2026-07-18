export async function GET() {
  return Response.json({
    service: "charitymap-web",
    status: "ok",
    databaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  })
}

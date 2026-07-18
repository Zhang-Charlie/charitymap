<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# CharityMap frontend rules

- Use the App Router
- Prefer Server Components unless browser APIs or interaction require a Client Component
- Keep public financial claims sourced and clearly labelled
- Do not place the Supabase service-role key in frontend code
- Use demonstration data only when it is visibly marked as demonstration data
- Keep map style configuration optional so local builds work without paid map services

import { db } from "~~/server/database/client"

export default defineEventHandler(async () => {
  const tracks = await db.selectFrom('tracks').select('id').execute()
  return tracks
})

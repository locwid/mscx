import { db } from '~~/server/database/client'

export default defineEventHandler(async () => {
  const tracks = await db.selectFrom('tracks').selectAll().execute()
  return tracks
})

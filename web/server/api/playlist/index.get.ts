import { db } from '~~/server/database/client'

export default defineEventHandler(async () => {
  const playlists = await db.selectFrom('playlists').selectAll().execute()
  return playlists
})

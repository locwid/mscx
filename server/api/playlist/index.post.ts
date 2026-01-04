import z from 'zod'
import { db } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const { id, name } = await readValidatedBody(event, (value) =>
    z.object({ id: z.string(), name: z.string() }).parse(value),
  )
  await db.insertInto('playlists').values({ id, name }).execute()
})

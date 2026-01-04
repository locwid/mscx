import z from 'zod'
import { db } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const { ids } = await readValidatedBody(event, (value) =>
    z.object({ ids: z.string().array().min(1) }).parse(value),
  )
  await db.deleteFrom('playlists').where('id', 'in', ids).execute()
})

import { db } from '~~/server/database/client'
import z from 'zod'

export default defineEventHandler(async (event) => {
  const { ids } = await readValidatedBody(event, (value) =>
    z.object({ ids: z.string().array().min(1) }).parse(value),
  )
  await db.deleteFrom('tracks').where('id', 'in', ids).execute()
})

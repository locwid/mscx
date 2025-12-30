import z from 'zod'
import { db } from '~~/server/database/client'
import { fileService } from '~~/server/services/file-service'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)

  const { id, name, createdAt, file } = z
    .object({
      id: z.string(),
      name: z.string(),
      file: z.file(),
      createdAt: z.iso.datetime(),
    })
    .parse({
      file: formData.get('file'),
      id: formData.get('id'),
      name: formData.get('name'),
      createdAt: formData.get('createdAt'),
    })

  await db
    .insertInto('tracks')
    .values({
      id,
      name,
      createdAt,
    })
    .execute()
  await fileService.save(id, await file.bytes())
})

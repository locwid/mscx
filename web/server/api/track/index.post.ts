import z from 'zod'
import { db } from '~~/server/database/client'
import { fileService } from '~~/server/services/file-service'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)

  const {
    payload: { id, name, metadata, createdAt },
    file,
  } = z
    .object({
      payload: z.object({
        id: z.string(),
        name: z.string(),
        metadata: z.object({
          size: z.number(),
          originalName: z.string(),
          duration: z.number(),
          mimeType: z.string(),
        }),
        createdAt: z.iso.datetime(),
      }),
      file: z.file(),
    })
    .parse({
      file: formData.get('file'),
      payload: JSON.parse(formData.get('payload') as string),
    })

  await db
    .insertInto('tracks')
    .values({
      id,
      name,
      metadata: JSON.stringify(metadata),
      createdAt,
    })
    .execute()
  await fileService.save(id, await file.bytes())
})

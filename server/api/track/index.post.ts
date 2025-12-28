import { nanoid } from 'nanoid'
import { db } from '~~/server/database/client'
import { fileService } from '~~/server/services/file-service'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const entries = formData.getAll('files')
  const files: File[] = []
  for (const entry of entries) {
    if (entry instanceof File) {
      files.push(entry)
    }
  }
  const payload = files.map((file) => ({
    id: nanoid(),
    file,
    name: file.name,
  }))
  await db
    .insertInto('tracks')
    .values(payload.map(({ id, name }) => ({ id, name })))
    .execute()
  await Promise.all(
    payload.map(async (p) => fileService.save(p.id, await p.file.bytes())),
  )
})

import { fileService } from '~~/server/services/file-service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Invalid id parameter',
    })
  }
  const stream = await fileService.getStream(id)
  if (!stream) {
    throw createError({
      statusCode: 404,
      message: 'File not found',
    })
  }
  return sendStream(event, stream)
})

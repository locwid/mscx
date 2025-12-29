import { fileService } from '~~/server/services/file-service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Invalid id parameter',
    })
  }
  const exists = await fileService.isExists(id)
  if (!exists) {
    throw createError({
      statusCode: 404,
      message: 'File not found',
    })
  }
  const stats = await fileService.getStats(id)
  const range = getHeader(event, 'range')

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1

    if (start >= stats.size || end >= stats.size || start > end) {
      setHeaders(event, {
        'content-range': `bytes */${stats.size}`,
      })
      setResponseStatus(event, 416)
      return
    }

    const chunksize = end - start + 1

    setResponseStatus(event, 206)
    setHeaders(event, {
      'content-range': `bytes ${start}-${end}/${stats.size}`,
      'accept-ranges': 'bytes',
      'content-length': chunksize,
    })
    return sendStream(event, fileService.getStream(id, { start, end }))
  } else {
    setHeaders(event, {
      'content-length': stats.size,
    })
    return sendStream(event, fileService.getStream(id))
  }
})

import { fileService } from '../services/file-service'

export default defineNitroPlugin(async () => {
  await fileService.createDirectory('./_data/files')
})

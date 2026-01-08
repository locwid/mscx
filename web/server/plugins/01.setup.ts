import { withDataFolder } from '../config'
import { fileService } from '../services/file-service'

export default defineNitroPlugin(async () => {
  await fileService.createDirectory(withDataFolder('/files'))
})

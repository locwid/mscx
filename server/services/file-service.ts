import fs from 'fs/promises'
import { createReadStream, ReadStreamOptions } from 'fs'
import { withDataFolder } from '../config'

const makeFilePath = (key: string) => withDataFolder('/files', `${key}.bin`)

class FileService {
  async get(key: string): Promise<string | null> {
    const exists = await this.isExists(key)
    if (!exists) {
      return null
    }
    const file = await fs.readFile(makeFilePath(key), 'binary')
    return file
  }

  getStream(key: string, options?: ReadStreamOptions) {
    return createReadStream(makeFilePath(key), options)
  }

  async getStats(key: string) {
    return fs.stat(makeFilePath(key))
  }

  async save(key: string, file: NodeJS.ArrayBufferView): Promise<void> {
    await fs.writeFile(makeFilePath(key), file, 'binary')
  }

  async delete(key: string): Promise<void> {
    if (await this.isExists(key)) await fs.unlink(makeFilePath(key))
  }

  async isExists(key: string): Promise<boolean> {
    try {
      await fs.access(makeFilePath(key), fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  async createDirectory(path: string) {
    const exists = await fs
      .access(path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
    if (exists) return
    await fs.mkdir(path, { recursive: true })
  }
}

export const fileService = new FileService()

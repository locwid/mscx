import fs from 'fs/promises'
import path from 'path'

const FILES_FOLDER = './_data/files'
const makeFilePath = (key: string) => path.join(FILES_FOLDER, `${key}.bin`)

class FileService {
  async get(key: string): Promise<string | null> {
    const exists = await this.isExists(key)
    if (!exists) {
      return null
    }
    const file = await fs.readFile(makeFilePath(key), 'binary')
    return file
  }

  async save(key: string, file: NodeJS.ArrayBufferView): Promise<void> {
    await fs.writeFile(makeFilePath(key), file, 'binary')
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(makeFilePath(key))
  }

  async isExists(key: string): Promise<boolean> {
    try {
      await fs.access(makeFilePath(key), fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }
}

export const fileService = new FileService()

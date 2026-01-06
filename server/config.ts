import path from 'node:path'

export const withDataFolder = (...value: string[]) =>
  path.join(process.env.NUXT_DATA_FOLDER!, ...value)

import { FileMigrationProvider, Migrator } from "kysely"
import { db } from "./client"
import path from 'path'
import fs from 'fs/promises'

export const migrate = async () => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve('./server/database/migrations')
    })
  })
  await migrator.migrateToLatest()
}

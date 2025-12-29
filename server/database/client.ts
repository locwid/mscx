import { Database } from './types' // this is the Database interface we defined earlier
import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { fileService } from '../services/file-service'

const dialect = new SqliteDialect({
  database: async () => {
    await fileService.createDirectory('./_data')
    const client = new SQLite('./_data/data.db')
    client.pragma('journal_mode = WAL')
    client.pragma('foreign_keys = ON')
    return client
  },
})

export const db = new Kysely<Database>({
  dialect,
})

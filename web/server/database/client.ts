import { Database } from './types' // this is the Database interface we defined earlier
import SQLite from 'better-sqlite3'
import {
  CamelCasePlugin,
  Kysely,
  ParseJSONResultsPlugin,
  SqliteDialect,
} from 'kysely'
import { fileService } from '../services/file-service'
import { withDataFolder } from '../config'

const dialect = new SqliteDialect({
  database: async () => {
    await fileService.createDirectory(withDataFolder())
    const client = new SQLite(withDataFolder('/data.db'))
    client.pragma('journal_mode = WAL')
    client.pragma('foreign_keys = ON')
    return client
  },
})

export const db = new Kysely<Database>({
  dialect,
  plugins: [new ParseJSONResultsPlugin(), new CamelCasePlugin()],
})

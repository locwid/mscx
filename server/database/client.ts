import { Database } from './types' // this is the Database interface we defined earlier
import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'

const client = new SQLite('./_data/data.db')
client.pragma('journal_mode = WAL')
client.pragma('foreign_keys = ON')

const dialect = new SqliteDialect({
  database: client,
})

export const db = new Kysely<Database>({
  dialect,
})

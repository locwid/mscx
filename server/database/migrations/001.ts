import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('tracks')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .execute()
}

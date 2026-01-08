import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('tracks')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('metadata', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute()

  await db.schema
    .createTable('playlists')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('playlist_track')
    .addColumn('track_id', 'text', (col) =>
      col.references('tracks.id').onDelete('cascade'),
    )
    .addColumn('playlist_id', 'text', (col) =>
      col.references('playlists.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('playlist_track_pk', ['playlist_id', 'track_id'])
    .execute()
}

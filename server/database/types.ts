import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface Database {
  tracks: TrackTable
}

export interface TrackTable {
  id: Generated<number>
}

export type Track = Selectable<TrackTable>
export type NewTrack = Insertable<TrackTable>
export type TrackUpdate = Updateable<TrackTable>

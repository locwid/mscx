import { Insertable, JSONColumnType, Selectable, Updateable } from 'kysely'

export interface Database {
  tracks: TrackTable
  playlists: PlaylistTable
  playlistTrack: PlaylistTrackTable
}

export interface TrackTable {
  id: string
  name: string
  metadata: JSONColumnType<TrackMetadata>
  createdAt: string
}

export type Track = Selectable<TrackTable>
export type NewTrack = Insertable<TrackTable>
export type TrackUpdate = Updateable<TrackTable>

export interface PlaylistTable {
  id: string
  name: string
}

export type Playlist = Selectable<PlaylistTable>
export type NewPlaylist = Insertable<PlaylistTable>
export type PlaylistUpdate = Updateable<PlaylistTable>

export interface PlaylistTrackTable {
  trackId: string
  playlistId: string
}

export type PlaylistTracklist = Selectable<PlaylistTrackTable>
export type NewPlaylistTrack = Insertable<PlaylistTrackTable>
export type PlaylistTrackUpdate = Updateable<PlaylistTrackTable>

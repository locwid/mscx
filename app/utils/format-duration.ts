export function formatDuration(duration: number) {
  return `${Math.floor(duration / 60)}:${Math.round(duration % 60)
    .toString()
    .padStart(2, '0')}`
}

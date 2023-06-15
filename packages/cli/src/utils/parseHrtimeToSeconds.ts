export function parseHrtimeToSeconds(hrtime: [number, number]): string {
  const seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3)
  return seconds
}

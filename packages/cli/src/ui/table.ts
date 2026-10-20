/** Pads each column to its widest cell, one line per row. */
export function formatTable(rows: ReadonlyArray<ReadonlyArray<string>>): Array<string> {
  const widths = Array.from({ length: Math.max(0, ...rows.map((row) => row.length)) }, (_, index) => Math.max(...rows.map((row) => row[index]?.length ?? 0)))
  return rows.map((row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]!))
      .join('  ')
      .trimEnd(),
  )
}

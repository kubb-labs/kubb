import { styleText } from 'node:util'
import type { Adapter, DiagnosticLocation } from '@kubb/core'

/**
 * A location in source text, with a terminal code frame that underlines it.
 */
export type SpecPosition = {
  line: number
  column: number
  frame: Array<string>
}

// Diagnostics of one run share a source, so its line starts are indexed once. Splitting a large
// spec per diagnostic made code frames the slowest part of a run.
let cached: { source: string; starts: Array<number> } | undefined

function lineStarts(source: string): Array<number> {
  if (cached?.source !== source) {
    const starts = [0]
    for (let at = source.indexOf('\n'); at !== -1; at = source.indexOf('\n', at + 1)) starts.push(at + 1)
    cached = { source, starts }
  }
  return cached.starts
}

/**
 * Where `location` sits in `source` according to its adapter, with a code frame. `undefined` when the adapter cannot place it.
 */
export function locateInSpec({ adapter, source, location }: { adapter: Adapter; source: string; location: DiagnosticLocation }): SpecPosition | undefined {
  try {
    const range = adapter.locate?.(source, location)
    if (!range) return undefined
    const starts = lineStarts(source)
    // The 1-based line holding `range.start`: the last line start at or before it.
    let low = 0
    let high = starts.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (starts[mid]! <= range.start) low = mid
      else high = mid - 1
    }
    const lineText = (number: number) => source.slice(starts[number - 1], number < starts.length ? starts[number]! - 1 : source.length).replace(/\r$/, '')
    const line = low + 1
    const column = range.start - starts[low]! + 1
    const text = lineText(line)
    const width = String(line).length
    const gutter = (number?: number) => styleText('dim', `${number === undefined ? ''.padStart(width) : String(number).padStart(width)} │`)
    const carets = '^'.repeat(Math.max(1, Math.min(range.end - range.start, text.length - column + 1)))
    return {
      line,
      column,
      frame: [
        ...(line > 1 ? [`${gutter(line - 1)} ${lineText(line - 1)}`] : []),
        `${gutter(line)} ${text}`,
        `${gutter()} ${' '.repeat(column - 1)}${styleText('red', carets)}`,
      ],
    }
  } catch {
    return undefined
  }
}

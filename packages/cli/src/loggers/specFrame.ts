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
    for (const match of source.matchAll(/\n/g)) starts.push(match.index + 1)
    cached = { source, starts }
  }
  return cached.starts
}

/** The index of the last line start at or before `offset`, found by binary search. */
function lineIndex(starts: Array<number>, offset: number, low = 0, high = starts.length - 1): number {
  if (low >= high) return low
  const mid = (low + high + 1) >> 1
  return starts[mid]! <= offset ? lineIndex(starts, offset, mid, high) : lineIndex(starts, offset, low, mid - 1)
}

/**
 * Where `location` sits in `source` according to its adapter, with a code frame. `undefined` when the adapter cannot place it.
 */
export function locateInSpec({ adapter, source, location }: { adapter: Adapter; source: string; location: DiagnosticLocation }): SpecPosition | undefined {
  try {
    const range = adapter.locate?.(source, location)
    if (!range) return undefined
    const starts = lineStarts(source)
    const index = lineIndex(starts, range.start)
    const lineText = (number: number) => source.slice(starts[number - 1], number < starts.length ? starts[number]! - 1 : source.length).replace(/\r$/, '')
    const line = index + 1
    const column = range.start - starts[index]! + 1
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

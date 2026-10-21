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

/**
 * Where `location` sits in `source` according to its adapter, with a code frame. `undefined` when the adapter cannot place it.
 */
export function locateInSpec({ adapter, source, location }: { adapter: Adapter; source: string; location: DiagnosticLocation }): SpecPosition | undefined {
  const lines = source.split(/\r?\n/)
  try {
    const range = adapter.locate?.(source, location)
    if (!range) return undefined
    const before = source.slice(0, range.start).split('\n')
    const line = before.length
    const column = before.at(-1)!.length + 1
    const text = lines[line - 1] ?? ''
    const width = String(line).length
    const gutter = (number?: number) => styleText('dim', `${number === undefined ? ''.padStart(width) : String(number).padStart(width)} │`)
    const carets = '^'.repeat(Math.max(1, Math.min(range.end - range.start, text.length - column + 1)))
    return {
      line,
      column,
      frame: [
        ...(line > 1 ? [`${gutter(line - 1)} ${lines[line - 2]}`] : []),
        `${gutter(line)} ${text}`,
        `${gutter()} ${' '.repeat(column - 1)}${styleText('red', carets)}`,
      ],
    }
  } catch {
    return undefined
  }
}

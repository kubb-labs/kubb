import { read } from '@internals/utils'
import { styleText } from 'node:util'
import type { Adapter, DiagnosticLocation, SourceLocator } from '@kubb/core'

/**
 * A location in source text, with a terminal code frame that underlines it.
 */
export type SpecPosition = {
  line: number
  column: number
  frame: Array<string>
}

export type SpecLocator = (location: DiagnosticLocation) => SpecPosition | undefined

/**
 * Formats the ranges supplied by an adapter without interpreting the source language.
 */
export function createSpecLocator({ locate, source }: { locate: SourceLocator; source: string }): SpecLocator {
  const lines = source.split(/\r?\n/)
  return (location) => {
    try {
      const range = locate(location)
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
}

/**
 * Reads a local input once and asks its adapter to resolve diagnostic locations.
 */
export async function loadSpecLocator({ adapter, path }: { adapter: Adapter | undefined; path: string }): Promise<SpecLocator | undefined> {
  if (!adapter?.createSourceLocator) return undefined
  try {
    const source = await read(path)
    const locate = await adapter.createSourceLocator(source)
    return createSpecLocator({ locate, source })
  } catch {
    return undefined
  }
}

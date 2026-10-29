import { stripVTControlCharacters } from 'node:util'
import type { Adapter } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { locateInSpec } from './specFrame.ts'

// Places the pointer at the first occurrence of its last token in the source.
const adapter = {
  locate: (source: string, location: { pointer: string }) => {
    const token = location.pointer.split('/').at(-1)!
    const start = source.indexOf(token)
    return start === -1 ? undefined : { start, end: start + token.length }
  },
} as unknown as Adapter

const locate = (source: string, pointer: string) => {
  const position = locateInSpec({ adapter, source, location: { kind: 'document', pointer } })
  return position && { ...position, frame: position.frame.map((line) => stripVTControlCharacters(line)) }
}

describe('locateInSpec', () => {
  it('returns the line, column and a frame with the line before', () => {
    expect(locate('a: 1\nb:\n  name: x\n', '#/b/name')).toEqual({
      line: 3,
      column: 3,
      frame: ['2 │ b:', '3 │   name: x', '  │   ^^^^'],
    })
  })

  it('places a match on the first and on the last line', () => {
    expect(locate('first\nlast', '#/first')).toMatchObject({ line: 1, column: 1, frame: ['1 │ first', '  │ ^^^^^'] })
    expect(locate('first\nlast', '#/last')).toMatchObject({ line: 2, column: 1, frame: ['1 │ first', '2 │ last', '  │ ^^^^'] })
  })

  it('drops the carriage return of CRLF lines', () => {
    expect(locate('a: 1\r\nb: 2\r\n', '#/b')).toEqual({ line: 2, column: 1, frame: ['1 │ a: 1', '2 │ b: 2', '  │ ^'] })
  })

  it('indexes each new source instead of reusing the previous one', () => {
    expect(locate('x\ny\nz', '#/z')).toMatchObject({ line: 3 })
    expect(locate('z', '#/z')).toMatchObject({ line: 1 })
  })

  it('returns undefined when the adapter cannot place the location', () => {
    expect(locate('a: 1', '#/missing')).toBeUndefined()
  })
})

import { stripVTControlCharacters } from 'node:util'
import { type Adapter, defineExtension } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { locateInSpec } from './specFrame.ts'

const source = 'type Pet {\r\n  owner: Owner\r\n}\r\n'
const location = { kind: 'schema', pointer: 'Pet.owner' } as const

const adapterWith = (locate: Adapter['locate']) =>
  defineExtension({
    kind: 'adapter',
    meta: { name: 'graphql' },
    build: () => ({
      document: null,
      parse() {
        throw new Error('not used')
      },
      async validate() {},
      locate,
    }),
  })()

describe('source frames', () => {
  it('formats an adapter range in a non-YAML language, including CRLF input', () => {
    const adapter = adapterWith((text) => ({ start: text.indexOf('owner'), end: text.indexOf('owner') + 5 }))
    const position = locateInSpec({ adapter, source, location })
    expect(position && { ...position, frame: position.frame.map(stripVTControlCharacters) }).toStrictEqual({
      line: 2,
      column: 3,
      frame: ['1 │ type Pet {', '2 │   owner: Owner', '  │   ^^^^^'],
    })
  })

  it('omits a frame when the adapter cannot locate the diagnostic, has no locate, or throws', () => {
    expect(locateInSpec({ adapter: adapterWith(() => undefined), source, location })).toBeUndefined()
    expect(locateInSpec({ adapter: adapterWith(undefined), source, location })).toBeUndefined()
    expect(
      locateInSpec({
        adapter: adapterWith(() => {
          throw new Error('Cannot locate this pointer')
        }),
        source,
        location,
      }),
    ).toBeUndefined()
  })
})

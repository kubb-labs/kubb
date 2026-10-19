import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { defineExtension } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createSpecLocator, loadSpecLocator } from './specFrame.ts'

const source = 'type Pet {\r\n  owner: Owner\r\n}\r\n'
const location = { kind: 'schema', pointer: 'Pet.owner' } as const

describe('source frames', () => {
  it('formats an adapter range in a non-YAML language, including CRLF input', () => {
    const position = createSpecLocator({ source, locate: () => ({ start: source.indexOf('owner'), end: source.indexOf('owner') + 5 }) })(location)
    expect(position && { ...position, frame: position.frame.map(stripVTControlCharacters) }).toStrictEqual({
      line: 2,
      column: 3,
      frame: ['1 │ type Pet {', '2 │   owner: Owner', '  │   ^^^^^'],
    })
  })

  it('omits a frame when the adapter cannot locate the diagnostic', () => {
    expect(createSpecLocator({ source, locate: () => undefined })(location)).toBeUndefined()
  })

  it('omits a frame when the adapter lookup throws', () => {
    const locate = createSpecLocator({
      source,
      locate() {
        throw new Error('Cannot locate this pointer')
      },
    })
    expect(locate(location)).toBeUndefined()
  })

  it('loads the locator supplied by a custom adapter', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kubb-locator-'))
    const file = join(dir, 'schema.graphql')
    const adapter = defineExtension({
      kind: 'adapter',
      meta: { name: 'graphql' },
      build: () => ({
        document: null,
        parse() {
          throw new Error('not used')
        },
        async validate() {},
        createSourceLocator(text) {
          return (diagnostic) => (diagnostic.kind === 'schema' ? { start: text.indexOf('owner'), end: text.indexOf('owner') + 5 } : undefined)
        },
      }),
    })()
    try {
      await writeFile(file, source)
      const locate = await loadSpecLocator({ adapter, path: file })
      expect(locate?.(location)).toMatchObject({ line: 2, column: 3 })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('omits frames for an adapter without source lookup or an unreadable file', async () => {
    expect(await loadSpecLocator({ adapter: undefined, path: '/does/not/exist' })).toBeUndefined()
    const adapter = defineExtension({
      kind: 'adapter',
      meta: { name: 'test' },
      build: () => ({
        document: null,
        parse() {
          throw new Error('not used')
        },
        async validate() {},
        createSourceLocator: () => () => undefined,
      }),
    })()
    expect(await loadSpecLocator({ adapter, path: '/does/not/exist' })).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { defineParser } from './defineParser.ts'

describe('defineParser (deprecated)', () => {
  it('still accepts the deprecated setup', () => {
    const parser = defineParser({ meta: { name: 'text' }, setup: () => ({ extNames: ['.txt'], parse: () => 'text', print: () => '' }) })()

    expect(parser).toMatchObject({ name: 'text', extNames: ['.txt'] })
    expect(parser.parse({} as never)).toBe('text')
  })

  it('gives the factory form kind and a meta fallback', () => {
    const factory = defineParser((options: { name?: string }) => ({ name: options.name ?? 'text', extNames: undefined, parse: () => '', print: () => '' }))

    expect(factory.kind).toBe('parser')
    expect(factory()).toMatchObject({ name: 'text', meta: { name: 'text' } })
    expect(factory({ name: 'json' }).meta).toStrictEqual({ name: 'json' })
  })
})

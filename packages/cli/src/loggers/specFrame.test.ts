import { stripVTControlCharacters } from 'node:util'
import * as yaml from 'yaml'
import { describe, expect, it } from 'vitest'
import { createSpecLocator, loadSpecLocator } from './specFrame.ts'

const spec = [
  'components:',
  '  schemas:',
  '    Pet:',
  '      properties:',
  '        owner:',
  "          $ref: '#/components/schemas/Owner'",
  '    a/b:',
  '      type: string',
  '',
].join('\n')

describe('createSpecLocator', () => {
  it('points at the key the pointer names, with the line above and a caret under it', () => {
    const position = createSpecLocator(yaml, spec)({ pointer: '#/components/schemas/Pet/properties/owner' })

    expect(position && { ...position, frame: position.frame.map((line) => stripVTControlCharacters(line)) }).toStrictEqual({
      line: 5,
      column: 9,
      frame: ['4 │       properties:', '5 │         owner:', '  │         ^^^^^'],
    })
  })

  it('unescapes RFC 6901 tokens', () => {
    expect(createSpecLocator(yaml, spec)({ pointer: '#/components/schemas/a~1b' })).toMatchObject({ line: 7, column: 5 })
  })

  it('falls back to the $ref that uses a missing target', () => {
    expect(createSpecLocator(yaml, spec)({ pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })).toMatchObject({ line: 6, column: 17 })
  })

  it('reads JSON with the same parser', () => {
    const json = JSON.stringify({ components: { schemas: { Pet: { type: 'object' } } } }, null, 2)

    expect(createSpecLocator(yaml, json)({ pointer: '#/components/schemas/Pet' })).toMatchObject({ line: 4, column: 7 })
  })

  it('returns undefined for a pointer that is not in the spec', () => {
    expect(createSpecLocator(yaml, spec)({ pointer: '#/components/schemas/Missing' })).toBeUndefined()
  })
})

describe('loadSpecLocator', () => {
  it('returns undefined when the file cannot be read', async () => {
    expect(await loadSpecLocator('/does/not/exist.yaml')).toBeUndefined()
  })
})

import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { dereferenceWithRef, resolveRef } from './refs.ts'
import type { Document, SchemaObject } from './types.ts'

const document: Document = {
  openapi: '3.0.3',
  info: { title: '', version: '' },
  paths: {},
  components: {
    schemas: {
      Pet: { type: 'object', properties: { name: { type: 'string' } } },
      Order: {
        type: 'object',
        properties: { pet: { $ref: '#/components/schemas/Pet' } },
      },
    },
  },
} as Document

describe('resolveRef', () => {
  it('resolves a local $ref to its schema', () => {
    const result = resolveRef<SchemaObject>(document, '#/components/schemas/Pet')

    expect(result).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
    })
  })

  it.each([
    { title: 'an empty ref', $ref: '' },
    { title: 'a non-local (external) ref', $ref: 'https://example.com/schemas/Pet' },
  ])('returns null for $title', ({ $ref }) => {
    expect(resolveRef(document, $ref)).toBeNull()
  })

  it('reports a refNotFound diagnostic and resolves to null when the pointer cannot be resolved', () => {
    const reported: Array<Diagnostic> = []
    const result = Diagnostics.scope(
      (diagnostic) => reported.push(diagnostic),
      () => resolveRef(document, '#/components/schemas/Missing'),
    )

    expect(result).toBeNull()
    expect(reported).toContainEqual(
      expect.objectContaining({
        code: 'KUBB_REF_NOT_FOUND',
        severity: 'error',
        message: 'Could not find a definition for #/components/schemas/Missing.',
        location: { kind: 'schema', pointer: '#/components/schemas/Missing', ref: '#/components/schemas/Missing' },
      }),
    )
  })

  it('handles URL-encoded pointers', () => {
    const docWithEncoded: Document = {
      ...document,
      components: {
        schemas: {
          'Pet List': { type: 'array', items: { type: 'string' } },
        },
      },
    } as Document

    const result = resolveRef<SchemaObject>(docWithEncoded, '#/components/schemas/Pet%20List')

    expect(result).toStrictEqual({ type: 'array', items: { type: 'string' } })
  })

  it('unescapes ~1 and ~0 tokens and keeps an encoded slash inside its token', () => {
    const docWithPaths = {
      ...document,
      paths: { '/pets': { get: { operationId: 'listPets' } } },
      components: { schemas: { 'a~b': { type: 'string' }, 'a/b': { type: 'number' } } },
    } as unknown as Document

    expect(resolveRef(docWithPaths, '#/paths/~1pets/get')).toStrictEqual({ operationId: 'listPets' })
    expect(resolveRef<SchemaObject>(docWithPaths, '#/components/schemas/a~0b')).toStrictEqual({ type: 'string' })
    expect(resolveRef<SchemaObject>(docWithPaths, '#/components/schemas/a%2Fb')).toStrictEqual({ type: 'number' })
  })

  it('throws when the pointer cannot be resolved outside a build scope', () => {
    expect(() => resolveRef(document, '#/components/schemas/Missing')).toThrow('Could not find a definition for #/components/schemas/Missing.')
  })
})

describe('dereferenceWithRef', () => {
  it.each([
    { $ref: '#/components/schemas/Pet', expected: { type: 'object', properties: { name: { type: 'string' } } } },
    { $ref: '#/components/schemas/Order', expected: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Pet' } } } },
  ])('resolves $$ref and keeps the $ref field on the result', ({ $ref, expected }) => {
    expect(dereferenceWithRef<SchemaObject>(document, { $ref })).toStrictEqual({ $ref, ...expected })
  })

  it('returns a plain schema unchanged', () => {
    const schema: SchemaObject = { type: 'string' }

    expect(dereferenceWithRef(document, schema)).toBe(schema)
  })
})

import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { resolveOptions } from './resolveOptions.ts'

type Options = { output: string }

const operation = ast.factory.createOperation({
  operationId: 'listPets',
  method: 'GET',
  path: '/pets',
  tags: ['pets'],
  extensions: { 'x-internal': false },
  requestBody: { content: [ast.factory.createContent({ contentType: 'application/json' })] },
})
const schema = ast.factory.createSchema({ type: 'object', name: 'Pet' })

// Results are cached per options object and node, so each call gets its own options object.
const fresh = (): Options => ({ output: 'a' })

describe('resolveOptions', () => {
  it.each([
    { title: 'tag', filter: { type: 'tag', pattern: '^pe' } },
    { title: 'operationId', filter: { type: 'operationId', pattern: /list/ } },
    { title: 'path', filter: { type: 'path', pattern: '^/pets$' } },
    { title: 'lowercase method string', filter: { type: 'method', pattern: 'get' } },
    { title: 'lowercase method RegExp', filter: { type: 'method', pattern: /^get$/ } },
    { title: 'contentType', filter: { type: 'contentType', pattern: 'json' } },
    { title: 'extension key', filter: { type: 'extension', key: 'x-internal' } },
    { title: 'extension value', filter: { type: 'extension', key: 'x-internal', value: false } },
  ] as const)('excludes an operation by $title', ({ filter }) => {
    expect(resolveOptions<Options>(operation, { options: fresh(), exclude: [filter] })).toBeNull()
  })

  it('keeps an operation when no filter matches', () => {
    const exclude = [
      { type: 'extension', key: 'x-internal', value: true },
      { type: 'extension', key: 'x-other' },
      { type: 'schemaName', pattern: 'listPets' },
    ] as const

    expect(resolveOptions<Options>(operation, { options: fresh(), exclude: [...exclude] })).toStrictEqual({ output: 'a' })
  })

  it('matches a global RegExp on every call', () => {
    const exclude = [{ type: 'tag', pattern: /pets/g }] as const
    const other = ast.factory.createOperation({ operationId: 'b', method: 'GET', path: '/b', tags: ['pets'] })

    expect(resolveOptions<Options>(operation, { options: fresh(), exclude: [...exclude] })).toBeNull()
    expect(resolveOptions<Options>(other, { options: fresh(), exclude: [...exclude] })).toBeNull()
  })

  it('drops an operation outside include and merges the first matching override', () => {
    const override = [
      { type: 'tag', pattern: 'pets', options: { output: 'first' } },
      { type: 'path', pattern: 'pets', options: { output: 'second' } },
    ] as const

    expect(resolveOptions<Options>(operation, { options: fresh(), include: [{ type: 'tag', pattern: 'store' }] })).toBeNull()
    expect(resolveOptions<Options>(operation, { options: fresh(), include: [{ type: 'tag', pattern: 'pets' }], override: [...override] })).toStrictEqual({
      output: 'first',
    })
  })

  it('applies only schemaName filters to a schema', () => {
    const unnamed = ast.factory.createSchema({ type: 'string' })

    expect(resolveOptions<Options>(schema, { options: fresh(), exclude: [{ type: 'schemaName', pattern: '^Pet$' }] })).toBeNull()
    expect(resolveOptions<Options>(schema, { options: fresh(), include: [{ type: 'tag', pattern: 'store' }] })).toStrictEqual({ output: 'a' })
    expect(resolveOptions<Options>(schema, { options: fresh(), include: [{ type: 'schemaName', pattern: 'Store' }] })).toBeNull()
    expect(resolveOptions<Options>(unnamed, { options: fresh(), exclude: [{ type: 'schemaName', pattern: '.*' }] })).toStrictEqual({ output: 'a' })
    expect(resolveOptions<Options>(schema, { options: fresh(), override: [{ type: 'schemaName', pattern: 'Pet', options: { output: 'b' } }] })).toStrictEqual({
      output: 'b',
    })
  })

  it('caches the result per options object and node', () => {
    const options = fresh()
    const first = resolveOptions<Options>(operation, { options, override: [{ type: 'tag', pattern: 'pets', options: { output: 'b' } }] })

    expect(resolveOptions<Options>(operation, { options })).toBe(first)
    expect(resolveOptions<Options>(operation, { options: fresh() })).toStrictEqual({ output: 'a' })
  })
})

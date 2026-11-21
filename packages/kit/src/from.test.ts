import { ast } from '@kubb/ast'
import { type Config, Diagnostics, type Memo, withContext } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { FileContext } from './file.ts'
import { type FromOptions, type FromResolver, from } from './from.ts'
import { Resolver } from './resolver/Resolver.ts'

function createMemo(): Memo {
  const store = new Map<string, unknown>()
  const memo = (key: string, compute: () => unknown) => {
    if (!store.has(key)) store.set(key, compute())
    return store.get(key)
  }
  return Object.assign(memo, {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
    has: (key: string) => store.has(key),
  }) as Memo
}

const point = ast.factory.createSchema({ type: 'object', name: 'Point', properties: [] })
const listPets = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', tags: ['pets'] })
const pointOperation = ast.factory.createOperation({ operationId: 'point', method: 'GET', path: '/point', tags: ['geo'] })
const adminOperation = ast.factory.createOperation({ operationId: 'listUsers', method: 'GET', path: '/users', tags: ['admin'] })

type TestResolver = Resolver & {
  response: { options(node: ast.OperationNode): string }
  status(code: number): string
  tags(): Array<string>
  reserved: Array<string>
  lookup: Map<string, number>
  nested: { deep: { options(node: ast.OperationNode): string } }
}

const tsResolver = new Resolver({
  pluginName: 'plugin-ts',
  isTypeOnly: true,
  response: {
    options(node: ast.OperationNode) {
      return `${node.operationId}Options`
    },
  },
  status: (code: number) => `Status${code}`,
  tags: () => ['pets'],
  reserved: ['Pet'],
  nested: { deep: { options: (node: ast.OperationNode) => `${node.operationId}Deep` } },
} as never)
// Set after construction, as Resolver's own option handling flattens a Map passed in.
Object.assign(tsResolver, { lookup: new Map([['pets', 1]]) })

function createContext(): FileContext {
  const plugins: Record<string, unknown> = {
    'plugin-ts': { options: { output: { path: 'types', mode: 'directory' }, exclude: [{ type: 'tag', pattern: 'admin' }] } },
    'plugin-zod': { options: { output: { path: 'zod', mode: 'directory' } } },
  }
  const resolvers: Record<string, Resolver> = { 'plugin-ts': tsResolver, 'plugin-zod': new Resolver({ pluginName: 'plugin-zod' }) }
  return {
    config: { input: 'petStore.yaml', output: { path: 'src/gen' } } as unknown as Config,
    meta: {},
    memo: createMemo(),
    schemas: [point],
    root: '/root/src/gen',
    plugin: { name: 'plugin-zod' },
    resolver: resolvers['plugin-zod'],
    options: { output: { path: 'zod', mode: 'directory' } },
    getResolver: (name: string) => resolvers[name]!,
    requirePlugin: (name: string) => {
      if (!plugins[name]) throw new Error(`Plugin "${name}" not found`)
      return plugins[name]
    },
  } as unknown as FileContext
}

function fromIn(ctx: FileContext, plugin?: string, options?: FromOptions): { resolver: FromResolver<TestResolver>; has: (node: ast.OperationNode) => boolean } {
  return withContext(ctx as never, () => from(plugin, options)) as never
}

describe('from', () => {
  it('returns a schema name with a type-only import from the target file', () => {
    const name = fromIn(createContext(), 'plugin-ts').resolver.name('Point')

    expect(`${name}`).toBe('point')
    expect(name.import).toMatchObject({ name: ['point'], path: '/root/src/gen/types/point.ts', isTypeOnly: true })
  })

  it("points an operation name at the target's operation file, with the Operation suffix", () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts')

    expect(types.response.options(listPets).import?.path).toBe('/root/src/gen/types/listPets.ts')
    expect(types.response.options(pointOperation).import?.path).toBe('/root/src/gen/types/pointOperation.ts')
  })

  it('leaves out the import when the first argument names no generated file', () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts')

    expect(types.status(200)).toMatchObject({ name: 'Status200', import: null })
    expect(types.name('Unknown').import).toBeNull()
  })

  it("leaves out the import for a node the target's rules exclude", () => {
    const types = fromIn(createContext(), 'plugin-ts')

    expect(types.has(adminOperation)).toBe(false)
    expect(types.resolver.response.options(adminOperation).import).toBeNull()
  })

  it('wraps nested namespaces and returns non-string results, arrays and Maps as they are', () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts')

    expect(types.nested.deep.options(listPets)).toMatchObject({ name: 'listPetsDeep', import: { path: '/root/src/gen/types/listPets.ts' } })
    expect(types.tags()).toStrictEqual(['pets'])
    expect(types.reserved).toStrictEqual(['Pet'])
    expect(types.lookup.get('pets')).toBe(1)
  })

  it('takes the extname and suffix the target writes with', () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts', { extname: '.tsx', suffix: false })

    expect(types.response.options(pointOperation).import?.path).toBe('/root/src/gen/types/point.tsx')
  })

  it('wraps the current plugin without an argument', () => {
    expect(fromIn(createContext()).resolver.name('Point').import).toMatchObject({ path: '/root/src/gen/zod/point.ts', isTypeOnly: false })
  })

  it('reports KUBB_NO_CONTEXT outside a generator', () => {
    const call = () => withContext({ plugin: { name: 'plugin-zod' } } as never, () => from('plugin-ts'))

    expect(call).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext }) }))
  })
})

import { ast } from '@kubb/ast'
import { type Config, Diagnostics, type Memo, withContext } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { FileContext } from './file.ts'
import { type From, type FromResolver, from } from './from.ts'
import { getResolver, provide, slot } from './composables.ts'
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
  response: { options(node: ast.OperationNode): string; description(node: ast.OperationNode): string }
  status(code: number): string
  tags(): Array<string>
  reserved: Array<string>
  lookup: Map<string, number>
  nested: { deep: { options(node: ast.OperationNode): string } }
}

const tsResolver = new Resolver({
  pluginName: 'plugin-ts',
  response: {
    options(node: ast.OperationNode) {
      return `${node.operationId}Options`
    },
    description: (node: ast.OperationNode) => `Lists ${node.operationId}.`,
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

function fromIn(ctx: FileContext, plugin?: string): Omit<From, 'resolver'> & { resolver: FromResolver<TestResolver> } {
  return withContext(ctx as never, () => from(plugin)) as never
}

function provideIn(ctx: FileContext, plugin: string, factory: () => Resolver, { priority, name = 'types' }: { priority?: number; name?: string } = {}) {
  ctx.memo.set(slot.kit(plugin), true)
  const config = { plugins: [{ name: 'plugin-ts' }, { name: 'plugin-zod' }] }
  withContext({ plugin: { name: plugin }, memo: ctx.memo, config, setOptions() {} } as never, () => provide(name as never, factory as never, { priority }))
}

describe('from', () => {
  it('returns a schema name with its import from the target file', () => {
    const name = fromIn(createContext(), 'plugin-ts').resolver.name('Point')

    expect(`${name}`).toBe('point')
    expect(name.import).toMatchObject({ name: ['point'], path: '/root/src/gen/types/point.ts' })
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
    expect(types.response.description(listPets)).toMatchObject({ name: 'Lists listPets.', import: null })
  })

  it("leaves out the import for a node the target's rules exclude", () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts')

    expect(types.response.options(adminOperation).import).toBeNull()
  })

  it('wraps nested namespaces and returns non-string results, arrays and Maps as they are', () => {
    const { resolver: types } = fromIn(createContext(), 'plugin-ts')

    expect(types.nested.deep.options(listPets)).toMatchObject({ name: 'listPetsDeep', import: { path: '/root/src/gen/types/listPets.ts' } })
    expect(types.tags()).toStrictEqual(['pets'])
    expect(types.reserved).toStrictEqual(['Pet'])
    expect(types.lookup.get('pets')).toBe(1)
  })

  it('imports any name from the target file for a node', () => {
    const types = fromIn(createContext(), 'plugin-ts')

    expect(types.ref(listPets, 'ListPetsHeaders').import).toMatchObject({
      name: ['ListPetsHeaders'],
      path: '/root/src/gen/types/listPets.ts',
    })
    expect(types.ref(adminOperation, 'UsersHeaders').import).toBeNull()
  })

  it("follows the target's file name, without the Operation suffix when it has no schema generator", () => {
    const hooks = new Resolver({
      pluginName: 'plugin-hooks',
      file: {
        name: (node, exportName) => (exportName?.includes('Suspense') ? `${(node as ast.OperationNode).operationId}Suspense` : undefined),
      },
    })
    const base = createContext()
    base.memo.set(slot.templates('plugin-hooks'), [{ name: 'hooks', kind: 'Operation', render: () => null }])
    const ctx = {
      ...base,
      getResolver: (name: string) => (name === 'plugin-hooks' ? hooks : base.getResolver(name as never)),
      requirePlugin: (name: string) =>
        name === 'plugin-hooks' ? { options: { output: { path: 'hooks', mode: 'directory' } } } : base.requirePlugin(name as never),
    } as unknown as FileContext
    const own = fromIn(ctx, 'plugin-hooks')

    expect(own.ref(pointOperation, 'pointOptions').import?.path).toBe('/root/src/gen/hooks/point.ts')
    expect(own.ref(pointOperation, 'pointSuspenseOptions').import?.path).toBe('/root/src/gen/hooks/pointSuspense.ts')
  })

  it('wraps the current plugin without an argument', () => {
    expect(fromIn(createContext()).resolver.name('Point').import).toMatchObject({ path: '/root/src/gen/zod/point.ts' })
  })

  it('reads a provided name from the provider with the highest priority', () => {
    const ctx = createContext()
    const zodTypes = new Resolver({ pluginName: 'plugin-zod' })
    provideIn(ctx, 'plugin-zod', () => zodTypes, { priority: -1 })
    provideIn(ctx, 'plugin-ts', () => tsResolver)

    expect(fromIn(ctx, 'types').resolver.name('Point').import).toMatchObject({ path: '/root/src/gen/types/point.ts' })

    provideIn(ctx, 'plugin-zod', () => zodTypes, { priority: 1 })
    expect(fromIn(ctx, 'types').resolver.name('Point').import).toMatchObject({ path: '/root/src/gen/zod/point.ts' })
    expect(getResolver('types', ctx.memo)).toBe(zodTypes)
  })

  it('builds a provided resolver once and names its files with it', () => {
    const ctx = createContext()
    let calls = 0
    const zodTypes = new Resolver({ pluginName: 'plugin-zod', file: { name: () => 'types' } } as never)
    provideIn(ctx, 'plugin-zod', () => {
      calls++
      return zodTypes
    })

    expect(fromIn(ctx, 'types').resolver.name('Point').import).toMatchObject({ path: '/root/src/gen/zod/types.ts' })
    expect(getResolver('types', ctx.memo)).toBe(getResolver('types', ctx.memo))
    expect(calls).toBe(1)
  })

  it('fails for a source that no plugin provides and no plugin in the config has', () => {
    expect(() => fromIn(createContext(), 'types')).toThrow('Plugin "types" not found')
  })

  it('rejects a provided name that a plugin in the config uses', () => {
    const provideTs = () => provideIn(createContext(), 'plugin-zod', () => tsResolver, { name: 'plugin-ts' })

    expect(provideTs).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.pluginFailed }) }))
  })

  it('reports KUBB_NO_CONTEXT outside a generator', () => {
    const call = () => withContext({ plugin: { name: 'plugin-zod' } } as never, () => from('plugin-ts'))

    expect(call).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext }) }))
  })
})

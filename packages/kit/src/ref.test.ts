import { ast } from '@kubb/ast'
import { type Config, Diagnostics, type Memo, withContext } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { FileContext } from './file.ts'
import { createRef, ref } from './ref.ts'
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

type TestResolver = Resolver & {
  response: { options(node: ast.OperationNode): string }
  enum: { keyName(node: { name?: string | null }): string }
  status(code: number): string
  tags(): Array<string>
}

const tsResolver = new Resolver({
  pluginName: 'plugin-ts',
  isTypeOnly: true,
  response: {
    options(node: ast.OperationNode) {
      return `${node.operationId}Options`
    },
  },
  enum: {
    keyName(node: { name?: string | null }) {
      return `${node.name}Key`
    },
  },
  status: (code: number) => `Status${code}`,
  tags: () => ['pets'],
} as never)

function createContext(): FileContext {
  const plugins: Record<string, unknown> = {
    'plugin-ts': { options: { output: { path: 'types', mode: 'directory' }, exclude: [{ type: 'tag', pattern: 'geo' }] } },
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

describe('ref', () => {
  it('returns a schema name with a type-only import from the target file', () => {
    const name = createRef<TestResolver>(createContext(), 'plugin-ts').name('Point')

    expect(name.name).toBe('point')
    expect(`${name}`).toBe('point')
    expect(name.import).toMatchObject({ name: ['point'], path: '/root/src/gen/types/point.ts', isTypeOnly: true })
  })

  it('keeps isTypeOnly through Resolver.merge', () => {
    expect(Resolver.merge(tsResolver, {}).isTypeOnly).toBe(true)
    expect(new Resolver({ pluginName: 'plugin-zod' }).isTypeOnly).toBe(false)
  })

  it("points an operation name at the target's operation file, with the Operation suffix", () => {
    const types = createRef<TestResolver>(createContext(), 'plugin-ts')

    expect(types.response.options(listPets).import?.path).toBe('/root/src/gen/types/listPets.ts')
    expect(types.response.options(pointOperation).import?.path).toBe('/root/src/gen/types/pointOperation.ts')
  })

  it('reads the schema file from a { name } argument', () => {
    expect(createRef<TestResolver>(createContext(), 'plugin-ts').enum.keyName({ name: 'Point' }).import?.path).toBe('/root/src/gen/types/point.ts')
  })

  it('leaves out the import when the first argument names no file', () => {
    const status = createRef<TestResolver>(createContext(), 'plugin-ts').status(200)

    expect(status.name).toBe('Status200')
    expect(status.import).toBeNull()
  })

  it('returns non-string results as they are', () => {
    expect(createRef<TestResolver>(createContext(), 'plugin-ts').tags()).toStrictEqual(['pets'])
  })

  it("checks the target's filters with has", () => {
    const types = createRef<TestResolver>(createContext(), 'plugin-ts')

    expect(types.has(listPets)).toBe(true)
    expect(types.has(pointOperation)).toBe(false)
  })

  it('wraps the current plugin without an argument', () => {
    const own = createRef(createContext())

    expect(own.name('Point').import).toMatchObject({ path: '/root/src/gen/zod/point.ts', isTypeOnly: false })
  })

  it('reads the current context as a composable', () => {
    const ctx = createContext()

    expect(withContext(ctx as never, () => ref('plugin-ts').name('Point').import?.path)).toBe('/root/src/gen/types/point.ts')
  })

  it('reports KUBB_NO_CONTEXT outside a generator', () => {
    const call = () => withContext({ plugin: { name: 'plugin-zod' } } as never, () => ref('plugin-ts'))

    expect(call).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext }) }))
  })
})

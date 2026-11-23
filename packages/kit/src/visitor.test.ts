import { ast, createPrinter, type OperationNode, type PrinterFactoryOptions, type SchemaNode } from '@kubb/ast'
import { type Config, defineExtension as coreDefineExtension, Hookable, KubbDriver, type KubbHooks, memoryStorage, type Plugin, useKubb } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { Code, File } from '@kubb/renderer-jsx'
import { jsx } from '@kubb/renderer-jsx/jsx-runtime'
import { addGenerator, addMacro, addTemplate, getResolver, setMacros, setPrinter, setResolver, slot } from './composables.ts'
import { defineTemplate } from './defineTemplate.ts'
import { defineExtension, definePlugin, type KitSetupContext } from './defineExtension.ts'
import { file } from './file.ts'
import { from } from './from.ts'
import { Resolver } from './resolver/Resolver.ts'
import type { GeneratorContext, PrinterContext } from './types.ts'

const ref = (name: string) => ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })

function adapter(meta?: { tags: Array<{ name: string; parent: string }> }) {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({
      type: 'object',
      name: 'Pet',
      properties: [ast.factory.createProperty({ name: 'store', required: false, schema: ref('Store') })],
      pointer: '#/components/schemas/Pet',
    }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [], pointer: '#/components/schemas/Store' }),
    ast.factory.createSchema({ type: 'object', name: 'Unused', properties: [], pointer: '#/components/schemas/Unused' }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({
      operationId: 'getPet',
      method: 'GET',
      path: '/pet',
      tags: ['pet'],
      parameters: [ast.factory.createParameter({ name: 'pet', in: 'query', required: false, schema: ref('Pet') })],
    }),
    ast.factory.createOperation({ operationId: 'getStore', method: 'GET', path: '/store', tags: ['store'] }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations, meta: meta ?? {} }) })
}

async function build(plugins: Array<Plugin>, meta?: Parameters<typeof adapter>[0]) {
  const config: Config = {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: adapter(meta),
    plugins,
    storage: memoryStorage(),
  }
  const driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })
  await driver.setup()
  const { diagnostics } = await driver.run()
  return { driver, diagnostics, files: driver.fileManager.files.map((file) => file.path).sort() }
}

function examplePlugin(log: Array<string>, include?: Array<{ type: 'tag'; pattern: string }>) {
  return defineExtension({
    kind: 'plugin',
    meta: { name: 'plugin-example' },
    setup(options) {
      setResolver({ name: (name: string) => `Api${name}` })
      addMacro({ name: 'suffix', schema: (node: SchemaNode) => ({ ...node, description: 'macro' }) })
      addGenerator({
        name: 'example',
        match: (node: SchemaNode | OperationNode) => !('operationId' in node) || node.operationId !== 'getStore',
        schema(node: SchemaNode, ctx: GeneratorContext) {
          log.push(`schema:${ctx.resolver.name(node.name ?? '')}:${node.description}`)
          return [ast.factory.createFile({ path: `gen/${ctx.resolver.name(node.name ?? '')}.ts`, baseName: 'x.ts', sources: [] })]
        },
        operation(node: OperationNode) {
          log.push(`operation:${node.operationId}`)
          return []
        },
        operations(nodes: Array<OperationNode>) {
          log.push(`operations:${nodes.map((node) => node.operationId).join(',')}`)
          return []
        },
      })
      return include ? { ...options, include } : options
    },
  })()
}

describe('generatorVisitor', () => {
  it('passes the setup context as this, ctx and useKubb() to a kit plugin setup', async () => {
    const seen: Array<boolean> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-this' },
      setup(options, ctx) {
        seen.push(this === ctx && useKubb() === ctx)
        return options
      },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          seen.push(this === ctx && useKubb() === ctx)
        },
      },
    })

    await build([plugin({})])

    expect(seen).toStrictEqual([true, true])
  })

  it('registers through setup context methods the same as the composables', async () => {
    const seen: Array<boolean> = []
    const generator = { name: 'methods', schema: () => [] }
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-methods' },
      setup(options, kubb) {
        kubb.setResolver({ name: (name: string) => `Api${name}` })
        kubb.addGenerator(generator)
        return options
      },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          seen.push(typeof ctx.addMacro === 'function')
        },
      },
    })

    const { driver } = await build([plugin({})])

    expect(seen).toStrictEqual([true])
    expect(
      (driver.memo.get(slot.templates('plugin-methods')) as Array<{ name: string; kind: string }>).map(({ name, kind }) => `${name}:${kind}`),
    ).toStrictEqual(['methods:Schema'])
    expect(getResolver('plugin-methods', driver.memo).name('Pet')).toBe('ApiPet')
  })

  it('keeps setup context methods the context already has', () => {
    const spy = vi.fn()
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-mocked' },
      setup(options, kubb) {
        kubb.addGenerator({ name: 'mocked', schema: () => [] })
        return options
      },
    })({})
    const ctx = { plugin: { name: 'plugin-mocked' }, memo: { set: vi.fn() }, addGenerator: spy } as unknown as KitSetupContext

    plugin.setup?.call(ctx, {}, ctx)

    expect(spy).toHaveBeenCalledOnce()
    expect(ctx.setResolver).toBeTypeOf('function')
  })

  it('runs macros, the resolver, match and every generator kind', async () => {
    const log: Array<string> = []

    const { diagnostics, files } = await build([examplePlugin(log)])

    expect(diagnostics.filter((diagnostic) => diagnostic.severity !== 'info')).toStrictEqual([])
    expect(log).toStrictEqual(['schema:ApiPet:macro', 'schema:ApiStore:macro', 'schema:ApiUnused:macro', 'operation:getPet', 'operations:getPet,getStore'])
    expect(files).toStrictEqual(['gen/ApiPet.ts', 'gen/ApiStore.ts', 'gen/ApiUnused.ts'])
  })

  it('filters operations and prunes the schemas they do not reach', async () => {
    const log: Array<string> = []

    const { files } = await build([examplePlugin(log, [{ type: 'tag', pattern: 'pet' }])])

    expect(log).toStrictEqual(['schema:ApiPet:macro', 'schema:ApiStore:macro', 'operation:getPet', 'operations:getPet'])
    expect(files).toStrictEqual(['gen/ApiPet.ts', 'gen/ApiStore.ts'])
  })

  it('keeps one template per generator handler and the resolver in memo', async () => {
    const { driver } = await build([examplePlugin([])])

    expect(driver.memo.get(slot.templates('plugin-example'))).toHaveLength(3)
    expect(getResolver('plugin-example', driver.memo).name('Pet')).toBe('ApiPet')
    expect(getResolver('plugin-missing', driver.memo).name('Pet')).toBe('pet')
    expect(getResolver('plugin-missing', driver.memo)).toBe(getResolver('plugin-missing', driver.memo))
  })

  it('reads the running hook memo in getResolver(name) inside a generator and kubb:plugins:end', async () => {
    const seen: Array<string> = []
    const reader = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-reader' },
      hooks: {
        'kubb:plugins:end'() {
          seen.push(`end:${getResolver('plugin-example').name('Pet')}`)
        },
      },
      setup(options) {
        addGenerator({
          name: 'reader',
          schema(node) {
            if (node.name === 'Pet') seen.push(`schema:${getResolver('plugin-example').name('Pet')}`)
            return null
          },
        })
        return options
      },
    })()

    await build([examplePlugin([]), reader])

    expect(seen).toStrictEqual(['schema:ApiPet', 'end:ApiPet'])
  })

  it("runs generators of a plugin defined with kit's definePlugin", async () => {
    const log: Array<string> = []
    const plugin = definePlugin({
      meta: { name: 'plugin-define' },
      setup(options) {
        addGenerator({
          name: 'define',
          schema(node: SchemaNode) {
            log.push(node.name ?? '')
            return []
          },
        })
        return options
      },
    })()

    await build([plugin])

    expect(log).toStrictEqual(['Pet', 'Store', 'Unused'])
  })

  it('rejects kit composables in a plugin defined with core defineExtension', async () => {
    const plugin = coreDefineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-core' },
      setup(options) {
        addGenerator({ name: 'core', schema: () => null })
        return options
      },
    })()

    const { diagnostics } = await build([plugin])

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error', message: expect.stringContaining('`addGenerator()` was called for plugin "plugin-core"') }),
    )
  })

  it('rejects a setup-only kit composable inside a generator', async () => {
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-late' },
      setup(options) {
        addGenerator({
          name: 'late',
          schema() {
            addGenerator({ name: 'nested', schema: () => null })
            return null
          },
        })
        return options
      },
    })()

    const { diagnostics } = await build([plugin])

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error', message: expect.stringContaining('`addGenerator()` runs only in `setup` or `kubb:plugin:setup`') }),
    )
  })

  it('runs a plugin visit hook after the kit visitor', async () => {
    const log: Array<string> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-own' },
      setup(options) {
        addGenerator({
          name: 'own',
          schema(node: SchemaNode) {
            log.push(`generator:${node.name}`)
            return []
          },
        })
        return options
      },
      hooks: {
        'kubb:plugin:visit:schema'(node) {
          log.push(`hook:${node.name}`)
        },
      },
    })()

    await build([plugin])

    expect(log.slice(0, 2)).toStrictEqual(['generator:Pet', 'hook:Pet'])
  })

  it('tags the memo resolver of a plugin without generators', async () => {
    const setTags = vi.spyOn(Resolver.prototype, 'setTags')
    const tags = [{ name: 'pet', parent: 'animals' }]
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-tags' },
      setup(options) {
        setResolver({ name: (name: string) => name })
        return options
      },
    })()

    const { driver } = await build([plugin], { tags })

    expect(setTags.mock.contexts).toContain(getResolver('plugin-tags', driver.memo))
    expect(setTags).toHaveBeenCalledWith(tags)
    setTags.mockRestore()
  })

  it('builds ctx.printer once per build and once per matching override', async () => {
    const built: Array<unknown> = []
    const seen: Array<[string, unknown]> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-printer' },
      setup(options) {
        setPrinter((ctx) => {
          const printer = { label: (ctx.options as { label?: string }).label }
          built.push(printer)
          return printer
        })
        addGenerator({
          name: 'printer',
          schema(node: SchemaNode, ctx: GeneratorContext) {
            seen.push([node.name ?? '', ctx.printer])
            return null
          },
        })
        return { ...options, override: [{ type: 'schemaName', pattern: '^Pet$', options: { label: 'pet' } }] }
      },
    })()

    await build([plugin])

    expect(built).toStrictEqual([{ label: 'pet' }, { label: undefined }])
    expect(seen.map(([name, printer]) => [name, built.indexOf(printer)])).toStrictEqual([
      ['Pet', 0],
      ['Store', 1],
      ['Unused', 1],
    ])
  })

  it('runs generators, the printer factory, kubb:generate:* listeners and own visit hooks with this === ctx === useKubb()', async () => {
    const seen: Array<string> = []
    const check = (label: string, self: unknown, ctx: unknown) => {
      if (self === ctx && useKubb() === ctx) seen.push(label)
    }
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-context' },
      hooks: {
        'kubb:generate:schema'(_node, ctx) {
          if (ctx.plugin.name === 'plugin-context') check('generate:schema', this, ctx)
        },
        'kubb:plugin:visit:end'(ctx) {
          check('visit:end', this, ctx)
        },
      },
      setup(options) {
        setPrinter(function (this: PrinterContext, ctx) {
          check('printer', this, ctx)
          return {}
        })
        addGenerator({
          name: 'context',
          match(node, ctx) {
            if (('name' in node && node.name === 'Pet') || ('operationId' in node && node.operationId === 'getPet')) check('match', this, ctx)
            return true
          },
          schema(node, ctx) {
            if (node.name === 'Pet') check('schema', this, ctx)
            return null
          },
          operation(node, ctx) {
            if (node.operationId === 'getPet') check('operation', this, ctx)
            return null
          },
          operations(_nodes, ctx) {
            check('operations', this, ctx)
            return null
          },
        })
        return options
      },
    })()

    const { diagnostics } = await build([plugin])

    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toStrictEqual([])
    expect(seen).toStrictEqual([
      'printer',
      'match',
      'schema',
      'generate:schema',
      'generate:schema',
      'generate:schema',
      'match',
      'operation',
      'operations',
      'visit:end',
    ])
  })

  it('gives generators the same file and from through ctx, this and the composables', async () => {
    const paths: Array<Array<string>> = []
    const imports: Array<Array<string | undefined>> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-file' },
      setup(options) {
        addGenerator({
          name: 'file',
          schema(this: GeneratorContext, node: SchemaNode, ctx: GeneratorContext) {
            paths.push([ctx.file(node).path, this.file(node).path, file(node).path])
            imports.push([ctx.from().resolver.name(node.name!).import?.path, from().resolver.name(node.name!).import?.path])
            return null
          },
        })
        return options
      },
    })({ output: { path: 'models', mode: 'directory' } })

    await build([plugin])

    expect(paths).toHaveLength(3)
    for (const [fromCtx, fromThis, fromComposable] of paths) {
      expect(fromThis).toBe(fromCtx)
      expect(fromComposable).toBe(fromCtx)
      expect(fromCtx).toContain('models')
    }
    expect(imports).toHaveLength(3)
    for (const [fromCtx, fromComposable] of imports) {
      expect(fromCtx).toContain('models')
      expect(fromComposable).toBe(fromCtx)
    }
  })

  it('leaves ctx.printer undefined without setPrinter', async () => {
    const printers: Array<unknown> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-no-printer' },
      setup(options) {
        addGenerator({
          name: 'no-printer',
          schema(_node: SchemaNode, ctx: GeneratorContext) {
            printers.push(ctx.printer)
            return null
          },
        })
        return options
      },
    })()

    await build([plugin])

    expect(printers).toStrictEqual([undefined, undefined, undefined])
  })

  it('gives printer handlers from() and passes transform options to the whole subtree', async () => {
    const seen: Array<string> = []
    const printer = createPrinter<PrinterFactoryOptions<'subtree', { depth: number }, string>>((options) => ({
      name: 'subtree',
      options,
      nodes: {
        object(node, ctx) {
          return node.properties.map((property) => ctx!.transform(property.schema, { depth: this.options.depth + 1 })).join(',')
        },
        ref(node) {
          const ref = from().resolver.name(node.name ?? '')
          seen.push(`${ref.name}:${this.options.depth}:${ref.import ? 'import' : 'none'}`)
          return ref.name
        },
      },
    }))
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-subtree' },
      setup(options) {
        setResolver({ name: (name: string) => `Api${name}` })
        setPrinter(() => printer({ depth: 0 }))
        addGenerator({
          name: 'print',
          schema(node: SchemaNode, ctx: GeneratorContext) {
            if (node.name === 'Pet') (ctx.printer as ReturnType<typeof printer>).print(node)
            return null
          },
        })
        return options
      },
    })()

    const { diagnostics } = await build([plugin])

    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toStrictEqual([])
    expect(seen).toStrictEqual(['ApiStore:1:import'])
  })

  describe('templates', () => {
    it('names the plugin and kind when a template returns something no renderer can write', async () => {
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-label' },
        setup(options) {
          addTemplate(defineTemplate({ kind: 'Schema', render: () => jsx(File, { baseName: 'x.ts', path: 'gen/x.ts' }) }), { renderer: null })
          return options
        },
      })()

      const { diagnostics } = await build([plugin])

      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('"plugin-label Schema template" returned a value without a renderer'),
        }),
      )
    })

    it('runs a template whose render is a class method', async () => {
      class PetTemplate {
        readonly kind = 'Schema' as const
        render(node: SchemaNode) {
          return node.name === 'Pet' ? ast.factory.createFile({ baseName: 'Pet.ts', path: 'gen/Pet.ts', sources: [] }) : null
        }
      }
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-class-template' },
        setup(options) {
          addTemplate(new PetTemplate())
          return options
        },
      })()

      const { files } = await build([plugin])

      expect(files).toStrictEqual(['gen/Pet.ts'])
    })

    it('writes JSX and AST files from templates, after the generators registered before them', async () => {
      const log: Array<string> = []
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-templates' },
        setup(options) {
          addGenerator({ name: 'legacy', schema: (node: SchemaNode) => (log.push(`generator:${node.name}`), null) })
          addTemplate(
            defineTemplate({
              kind: 'Schema',
              render(node) {
                log.push(`schema:${node.name}`)
                return jsx(File, {
                  baseName: `${node.name}.ts`,
                  path: `gen/${node.name}.ts`,
                  children: jsx(Code, { name: node.name ?? '', children: `export type ${node.name} = {}` }),
                })
              },
            }),
          )
          addTemplate(
            defineTemplate({
              kind: 'Operation',
              render: (node) => ast.factory.createFile({ baseName: `${node.operationId}.ts`, path: `gen/${node.operationId}.ts`, sources: [] }),
            }),
          )
          addTemplate(
            defineTemplate({
              kind: 'Operations',
              render: (nodes) => [ast.factory.createFile({ baseName: 'index.ts', path: 'gen/index.ts', sources: [] })].filter(() => nodes.length === 2),
            }),
          )
          return options
        },
      })()

      const { files, diagnostics } = await build([plugin])

      expect(diagnostics.filter((diagnostic) => diagnostic.severity !== 'info')).toStrictEqual([])
      expect(log.slice(0, 2)).toStrictEqual(['generator:Pet', 'schema:Pet'])
      expect(files).toStrictEqual(['gen/Pet.ts', 'gen/Store.ts', 'gen/Unused.ts', 'gen/getPet.ts', 'gen/getStore.ts', 'gen/index.ts'])
    })
  })

  describe('user macros', () => {
    const userMacro = { name: 'user', schema: (node: SchemaNode) => ({ ...node, description: `${node.description ?? ''}user` }) }
    const ownMacro = { name: 'own', schema: (node: SchemaNode) => ({ ...node, description: `${node.description ?? ''}own+` }) }

    function macroPlugin(setMacrosList?: Array<typeof userMacro>) {
      return defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-macros' },
        setup(options: { macros?: Array<typeof userMacro> }) {
          addMacro(ownMacro)
          if (setMacrosList) setMacros(setMacrosList)
          addGenerator({
            name: 'log',
            schema(node: SchemaNode, ctx: GeneratorContext) {
              ctx.info(`${node.name}:${node.description}`)
              return null
            },
          })
          return options
        },
      })({ macros: [userMacro] })
    }

    const described = (diagnostics: Array<{ message?: string }>) =>
      diagnostics.flatMap((diagnostic) => (diagnostic.message?.startsWith('Pet:') ? [diagnostic.message] : []))

    it("applies the user's macros option after the plugin's own macros", async () => {
      const { diagnostics } = await build([macroPlugin()])

      expect(described(diagnostics)).toStrictEqual(['Pet:own+user'])
    })

    it.each([
      ['after its own macro', [ownMacro, userMacro]],
      ['before its own macro', [userMacro, ownMacro]],
      ['as a copy', [{ ...userMacro }, ownMacro]],
    ])('applies a user macro once and last when the plugin passes it to setMacros %s', async (_name, list) => {
      const { diagnostics } = await build([macroPlugin(list)])

      expect(described(diagnostics)).toStrictEqual(['Pet:own+user'])
    })
  })

  describe('renderer', () => {
    const schemaFile = (node: SchemaNode) =>
      jsx(File, {
        baseName: `${node.name}.ts`,
        path: `gen/${node.name}.ts`,
        children: jsx(Code, { name: node.name ?? '', children: `export type ${node.name} = {}` }),
      })

    function rendererPlugin(renderer?: null) {
      return defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-renderer' },
        setup(options) {
          addGenerator({ name: 'jsx', ...(renderer === null ? { renderer } : {}), schema: schemaFile })
          return options
        },
      })()
    }

    it('renders JSX with jsxRenderer when the generator sets no renderer', async () => {
      const { files, diagnostics } = await build([rendererPlugin()])

      expect(files).toStrictEqual(['gen/Pet.ts', 'gen/Store.ts', 'gen/Unused.ts'])
      expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'warning')).toStrictEqual([])
    })

    it('writes a single FileNode without a renderer or a warning', async () => {
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin-ast' },
        setup(options) {
          addGenerator({
            name: 'ast',
            schema: (node: SchemaNode) =>
              ast.factory.createFile({
                baseName: `${node.name}.ts`,
                path: `gen/${node.name}.ts`,
                sources: [ast.factory.createSource({ name: node.name, nodes: [ast.factory.createText(`export type ${node.name} = {}`)] })],
              }),
          })
          return options
        },
      })()

      const { files, diagnostics } = await build([plugin])

      expect(files).toStrictEqual(['gen/Pet.ts', 'gen/Store.ts', 'gen/Unused.ts'])
      expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'warning')).toStrictEqual([])
    })

    it('writes nothing and warns for JSX from a generator with renderer: null', async () => {
      const { files, diagnostics } = await build([rendererPlugin(null)])

      expect(files).toStrictEqual([])
      expect(diagnostics).toContainEqual(
        expect.objectContaining({ severity: 'warning', message: expect.stringContaining('"jsx" returned a value without a renderer') }),
      )
    })
  })
})

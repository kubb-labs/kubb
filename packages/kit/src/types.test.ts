import type { OperationNode } from '@kubb/ast'
import { describe, expectTypeOf, it } from 'vitest'
import type { getResolver, provide } from './composables.ts'
import type { from, RefName } from './from.ts'
import type { Resolver } from './resolver/Resolver.ts'
import { templateKinds } from './defineTemplate.ts'
import type { defineTemplate } from './defineTemplate.ts'
import type { GeneratorContext, PluginType, Template, TemplateNode } from './types.ts'

type Options = { output?: string }
type MyResolver = Resolver & { custom(): string }
type MyPrinter = { print(): string }

describe('PluginType', () => {
  it('defaults the resolver to kit Resolver', () => {
    type Plugin = PluginType<'plugin-a', Options>

    expectTypeOf<Plugin['resolver']>().toEqualTypeOf<Resolver>()
  })

  it('types ctx.resolver and ctx.printer from the 4th and 5th arguments', () => {
    type Plugin = PluginType<'plugin-a', Options, Options, MyResolver, MyPrinter>

    expectTypeOf<GeneratorContext<Plugin>['resolver']>().toEqualTypeOf<MyResolver>()
    expectTypeOf<GeneratorContext<Plugin>['printer']>().toEqualTypeOf<MyPrinter>()
  })
})

type TypesResolver = Resolver & {
  response: { options(node: OperationNode): string; label(): string | null }
  tags(): Array<string>
  lookup: Map<string, string>
}

// Test-only names. They join the registries for the whole typecheck program.
declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-types-test': PluginType<'plugin-types-test', object, object, TypesResolver>
    }
    interface ProvideRegistry {
      'types-test': TypesResolver
    }
  }
}

describe('from', () => {
  type FromTypes = ReturnType<typeof from<'plugin-types-test'>>['resolver']

  it('returns a RefName for each string a resolver member returns', () => {
    expectTypeOf<ReturnType<FromTypes['response']['options']>>().toEqualTypeOf<RefName>()
    expectTypeOf<ReturnType<FromTypes['response']['label']>>().toEqualTypeOf<RefName | null>()
  })

  it('keeps arrays, Maps and other results as they are', () => {
    expectTypeOf<ReturnType<FromTypes['tags']>>().toEqualTypeOf<Array<string>>()
    expectTypeOf<FromTypes['lookup']>().toEqualTypeOf<Map<string, string>>()
  })

  it('types a provided name by its provider and no source as a plain resolver', () => {
    expectTypeOf<ReturnType<typeof from<'types-test'>>['resolver']>().toEqualTypeOf<FromTypes>()
    expectTypeOf<ReturnType<typeof from<never>>['resolver']['name']>().toEqualTypeOf<(name: string) => RefName>()
  })

  it("types ctx.from() without a source as the current plugin's resolver", () => {
    const ctx = {} as GeneratorContext<Kubb.PluginRegistry['plugin-types-test']>
    expectTypeOf<ReturnType<typeof ctx.from<never>>['resolver']>().toEqualTypeOf<FromTypes>()
  })

  it('types getResolver by the plugin or provided name', () => {
    expectTypeOf<ReturnType<typeof getResolver<'types-test'>>>().toEqualTypeOf<TypesResolver>()
  })

  it('takes only a factory of the provided type in provide', () => {
    expectTypeOf<Parameters<typeof provide<'types-test'>>[1]>().toEqualTypeOf<() => TypesResolver>()
  })
})

describe('Template', () => {
  it('types the node render gets from kind', () => {
    expectTypeOf<Parameters<Extract<Template, { kind: 'Schema' }>['render']>[0]>().toEqualTypeOf<TemplateNode['Schema']>()
    expectTypeOf<Parameters<Extract<Template, { kind: 'Operations' }>['render']>[0]>().toEqualTypeOf<Array<OperationNode>>()
  })

  it("keeps the kind, so a template can call another template's render", () => {
    const check = (define: typeof defineTemplate) => {
      const schema = define({ kind: 'Schema', render: () => null })
      return define({ kind: 'Schema', render: (node, ctx) => schema.render(node, ctx) })
    }
    expectTypeOf<ReturnType<typeof check>['kind']>().toEqualTypeOf<'Schema'>()
  })

  it('narrows the node from a templateKinds value as from its string', () => {
    const check = (define: typeof defineTemplate) => define({ kind: templateKinds.operation, render: (node) => (node.operationId ? null : null) })
    expectTypeOf<ReturnType<typeof check>['kind']>().toEqualTypeOf<'Operation'>()
    expectTypeOf(templateKinds).toEqualTypeOf<{ readonly schema: 'Schema'; readonly operation: 'Operation'; readonly operations: 'Operations' }>()
  })

  it('rejects a render that reads a field its kind does not have', () => {
    const check = (define: typeof defineTemplate) =>
      define({
        kind: 'Operation',
        // @ts-expect-error an operation node has no `type`
        render: (node) => (node.type ? null : null),
      })
    expectTypeOf(check).toBeFunction()
  })
})

import { describe, expectTypeOf, it } from 'vitest'
import type { Resolver } from './resolver/Resolver.ts'
import type { GeneratorContext, PluginType } from './types.ts'

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

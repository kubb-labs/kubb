import type { PluginType as CorePluginType } from '@kubb/core'
import { describe, expectTypeOf, it } from 'vitest'
import type { Resolver } from './resolver/Resolver.ts'
import type { GeneratorContext, PluginType } from './types.ts'

type Options = { output?: string }
type MyResolver = Resolver & { custom(): string }
type MyPrinter = { print(): string }

describe('PluginType', () => {
  it('defaults the resolver to kit Resolver and keeps core fields', () => {
    type Plugin = PluginType<'plugin-a', Options>

    expectTypeOf<Plugin['resolver']>().toEqualTypeOf<Resolver>()
    expectTypeOf<Plugin['resolvedOptions']>().toEqualTypeOf<Options>()
    expectTypeOf<Plugin>().toExtend<CorePluginType<'plugin-a', Options>>()
  })

  it('types ctx.resolver and ctx.printer from the 4th and 5th arguments', () => {
    type Plugin = PluginType<'plugin-a', Options, Options, MyResolver, MyPrinter>

    expectTypeOf<GeneratorContext<Plugin>['resolver']>().toEqualTypeOf<MyResolver>()
    expectTypeOf<GeneratorContext<Plugin>['printer']>().toEqualTypeOf<MyPrinter>()
  })
})

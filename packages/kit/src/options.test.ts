import type { LiteralUnion } from '@internals/utils'
import type { Macro } from '@kubb/ast'
import type { Filter, Group, Resolver, ResolverPatch } from '@kubb/core'
import { describe, expect, expectTypeOf, it } from 'vitest'
import * as z from 'zod'
import {
  excludeSchema,
  filterSchema,
  groupSchema,
  includeSchema,
  macrosSchema,
  outputOptionsSchema,
  outputSchema,
  overrideSchema,
  resolverSchema,
  suggest,
  when,
} from './options.ts'
import type { WhenCondition } from './options.ts'
import { z as kitZ } from './index.ts'

function toJSONSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })
}

describe('JSON Schema output', () => {
  const baseSchema = z.object({ enumType: z.enum(['enum', 'literal']).optional() })

  it.each([
    ['outputSchema', outputSchema],
    ['groupSchema', groupSchema],
    ['outputOptionsSchema', outputOptionsSchema],
    ['filterSchema', filterSchema],
    ['includeSchema', includeSchema],
    ['excludeSchema', excludeSchema],
    ['overrideSchema', overrideSchema(baseSchema)],
    ['resolverSchema', resolverSchema()],
    ['macrosSchema', macrosSchema],
  ])('%s', async (name, schema) => {
    await expect(JSON.stringify(toJSONSchema(schema), null, 2)).toMatchFileSnapshot(`__snapshots__/options/${name}.json`)
  })

  it('suggest', () => {
    expect(toJSONSchema(suggest(['zod', 'zod/mini']))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "string",
        "x-kubb-values": [
          "zod",
          "zod/mini",
        ],
      }
    `)
  })

  it('when', () => {
    expect(toJSONSchema(z.boolean().meta(when({ 'enum.type': ['asConst', 'asPascalConst'] })))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "boolean",
        "x-kubb-when": {
          "enum.type": [
            "asConst",
            "asPascalConst",
          ],
        },
      }
    `)
  })
})

describe('outputOptionsSchema', () => {
  it('rejects group with an explicit file mode', () => {
    const result = outputOptionsSchema.safeParse({ output: { path: 'types', mode: 'file' }, group: { type: 'tag' } })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['group']])
  })

  it('rejects group when the path infers file mode', () => {
    const result = outputOptionsSchema.safeParse({ output: { path: 'types.ts' }, group: { type: 'tag' } })

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['group']])
  })

  it('accepts group with directory mode', () => {
    expect(outputOptionsSchema.safeParse({ output: { path: 'types', mode: 'directory' }, group: { type: 'tag' } }).success).toBe(true)
    expect(outputOptionsSchema.safeParse({ output: { path: 'clients.v2', mode: 'directory' }, group: { type: 'path' } }).success).toBe(true)
    expect(outputOptionsSchema.safeParse({ output: { path: 'types' }, group: { type: 'tag', name: ({ group }: { group: string }) => group } }).success).toBe(
      true,
    )
  })

  it('keeps the check after extend', () => {
    const optionsSchema = outputOptionsSchema.extend({ exclude: excludeSchema.optional() })

    expect(optionsSchema.safeParse({ output: { path: 'types.ts' }, group: { type: 'tag' } }).success).toBe(false)
  })
})

describe('schemas', () => {
  it('keeps functions as written', () => {
    const banner = () => '// banner'
    const parsed = outputSchema.parse({ path: 'types', banner })

    expect(parsed.banner).toBe(banner)
    expect(outputSchema.safeParse({ path: 'types', banner: 1 }).success).toBe(false)
  })

  it('accepts regex patterns in filters', () => {
    expect(
      includeSchema.parse([
        { type: 'path', pattern: /^\/pets/ },
        { type: 'method', pattern: 'GET' },
      ]),
    ).toHaveLength(2)
    expect(filterSchema.safeParse({ type: 'method', pattern: 'FETCH' }).success).toBe(false)
  })

  it('makes override options partial and drops override', () => {
    const baseSchema = outputOptionsSchema.extend({
      enumType: z.enum(['enum', 'literal']),
      override: z.array(z.unknown()).optional(),
    })
    const schema = overrideSchema(baseSchema)

    expect(schema.parse([{ type: 'tag', pattern: 'admin', options: { enumType: 'literal' } }])).toEqual([
      { type: 'tag', pattern: 'admin', options: { enumType: 'literal' } },
    ])
    expect(schema.safeParse([{ type: 'tag', pattern: 'admin', options: { enumType: 'other' } }]).success).toBe(false)

    expectTypeOf<z.output<typeof schema>[number]['options']>().toEqualTypeOf<{
      output?: z.output<typeof outputSchema> | undefined
      group?: z.output<typeof groupSchema> | undefined
      enumType?: 'enum' | 'literal' | undefined
    }>()
  })

  it('validates resolver and macros shapes', () => {
    expect(resolverSchema().safeParse({ name: (name: string) => name }).success).toBe(true)
    expect(resolverSchema().safeParse('resolver').success).toBe(false)
    expect(macrosSchema.safeParse([{ name: 'simplify-union' }]).success).toBe(true)
    expect(macrosSchema.safeParse([{ schema: () => undefined }]).success).toBe(false)
  })

  it('rejects a resolver member that is neither a method nor a namespace', () => {
    expect(resolverSchema().safeParse({ default: { name: (name: string) => name } }).success).toBe(true)
    expect(resolverSchema().safeParse({ file: 3 }).success).toBe(false)
  })

  it('rejects a macro hook that is not a function', () => {
    expect(macrosSchema.safeParse([{ name: 'x', enforce: 'pre', schema: () => undefined }]).success).toBe(true)
    expect(macrosSchema.safeParse([{ name: 'x', schema: 1 }]).success).toBe(false)
  })

  it('rejects group with a file output inside an override entry', () => {
    const schema = overrideSchema(outputOptionsSchema)
    const result = schema.safeParse([{ type: 'tag', pattern: 'admin', options: { output: { path: 'admin.ts' }, group: { type: 'tag' } } }])

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([[0, 'options', 'group']])
  })

  it('composes a plugin options schema', () => {
    const baseSchema = outputOptionsSchema.extend({
      exclude: excludeSchema.optional(),
      importPath: suggest(['zod', 'zod/mini']).optional(),
      constCasing: z
        .enum(['camelCase', 'PascalCase'])
        .meta(when({ enumType: 'asConst' }))
        .optional(),
    })
    const optionsSchema = baseSchema.extend({ override: overrideSchema(baseSchema).optional() })

    const options = optionsSchema.parse({
      output: { path: 'zod' },
      importPath: 'zod/mini',
      override: [{ type: 'tag', pattern: 'admin', options: { importPath: 'zod' } }],
    })

    expect(options.override?.[0]?.options).toEqual({ importPath: 'zod' })
    expectTypeOf(options.importPath).toEqualTypeOf<LiteralUnion<'zod' | 'zod/mini'> | undefined>()
  })

  it('matches the core types', () => {
    expectTypeOf<z.output<typeof filterSchema>>().toEqualTypeOf<Filter>()
    expectTypeOf<z.output<typeof groupSchema>>().toEqualTypeOf<Group>()
    expectTypeOf<z.output<typeof macrosSchema>>().toEqualTypeOf<Array<Macro>>()
    expectTypeOf<z.output<ReturnType<typeof resolverSchema<Resolver>>>>().toEqualTypeOf<ResolverPatch<Resolver>>()
  })
})

describe('suggest', () => {
  it('accepts any string', () => {
    const schema = suggest(['zod', 'zod/mini'])

    expect(schema.parse('zod')).toBe('zod')
    expect(schema.parse('my-zod')).toBe('my-zod')
    expect(schema.safeParse(1).success).toBe(false)
  })

  it('types the listed values as an open union', () => {
    const schema = suggest(['zod', 'zod/mini'])

    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<LiteralUnion<'zod' | 'zod/mini'>>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<LiteralUnion<'zod' | 'zod/mini'>>()
    expectTypeOf<'zod'>().toExtend<z.input<typeof schema>>()
    expectTypeOf<'any-string'>().toExtend<z.input<typeof schema>>()
  })
})

describe('when', () => {
  it('returns the x-kubb-when metadata', () => {
    const schema = z.string().meta({ description: 'Casing of const names.', ...when({ 'enum.type': 'asConst' }) })

    expect(schema.meta()).toEqual({ description: 'Casing of const names.', 'x-kubb-when': { 'enum.type': 'asConst' } })
  })

  it('types the condition', () => {
    expectTypeOf(when).parameter(0).toEqualTypeOf<WhenCondition>()
    expectTypeOf(when).returns.toEqualTypeOf<{ 'x-kubb-when': WhenCondition }>()
    expectTypeOf(when({ 'enum.type': ['asConst', 'asPascalConst'], enabled: true })).toExtend<z.GlobalMeta>()

    // @ts-expect-error a condition value must be a primitive or a list of primitives
    when({ 'enum.type': { nested: true } })
    // @ts-expect-error `.meta()` types `x-kubb-when`
    z.string().meta({ 'x-kubb-when': 'enum.type' })
    // @ts-expect-error `.meta()` types `x-kubb-values`
    z.string().meta({ 'x-kubb-values': [1] })
  })
})

describe('z', () => {
  it('is Zod with the Kubb option helpers', () => {
    expect(kitZ.object).toBe(z.object)
    expect(kitZ.toJSONSchema).toBe(z.toJSONSchema)
    expect(kitZ.suggest).toBe(suggest)
    expect(kitZ.when).toBe(when)
    expect(kitZ.outputOptionsSchema).toBe(outputOptionsSchema)
    expectTypeOf<kitZ.input<typeof outputSchema>>().toEqualTypeOf<z.input<typeof outputSchema>>()
    expectTypeOf<kitZ.WhenCondition>().toEqualTypeOf<WhenCondition>()
  })
})

import { describe, expect, expectTypeOf, it } from 'vitest'
import { createImport } from './nodes/file.ts'
import { createProperty } from './nodes/property.ts'
import { createSchema } from './nodes/schema.ts'
import type { PrinterFactoryOptions } from './createPrinter.ts'
import { createPrinter } from './createPrinter.ts'

describe('createPrinter', () => {
  type P = PrinterFactoryOptions<'zod', { strict?: boolean }, string>

  const zodPrinter = createPrinter<P>((options) => {
    return { name: 'zod', options, nodes: {} }
  })

  it('returns a printer with the provided name and resolved options', () => {
    const printer = zodPrinter({ strict: false })

    expect(printer.name).toBe('zod')
    expect(printer.options).toStrictEqual({ strict: false })
  })

  it('dispatches print() to the matching node handler and returns null when none matches', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string(node) {
          return `z.string()${node.min !== undefined ? `.min(${node.min})` : ''}`
        },
      },
    }))

    const printer = zodPrinter()

    expect(printer.print(createSchema({ type: 'string', min: 2 }))).toBe('z.string().min(2)')
    expect(printer.print(createSchema({ type: 'string' }))).toBe('z.string()')
    expect(printer.print(createSchema({ type: 'number' }))).toBeNull()
  })

  it('exposes resolved options on this.options inside handlers', () => {
    type P = PrinterFactoryOptions<'zod', { prefix?: string }, string>

    const zodPrinter = createPrinter<P>((options) => {
      const { prefix = 'z' } = options
      return {
        name: 'zod',
        options: { prefix },
        nodes: {
          string() {
            return `${this.options.prefix}.string()`
          },
        },
      }
    })

    expect(zodPrinter({ prefix: 'z' }).print(createSchema({ type: 'string' }))).toBe('z.string()')
    expect(zodPrinter({ prefix: 'y' }).print(createSchema({ type: 'string' }))).toBe('y.string()')
    expect(zodPrinter().print(createSchema({ type: 'string' }))).toBe('z.string()')
  })

  it('transforms nested object properties and union members through this.transform()', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
        number() {
          return 'z.number()'
        },
        object(node) {
          const props = node.properties.map((p) => `${p.name}: ${this.transform(p.schema)}`).join(', ')
          return `z.object({ ${props} })`
        },
        union(node) {
          const members = node.members?.map((m) => this.transform(m)).filter(Boolean) ?? []
          return `z.union([${members.join(', ')}])`
        },
      },
    }))

    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({
          name: 'id',
          schema: createSchema({ type: 'number' }),
        }),
        createProperty({
          name: 'label',
          schema: createSchema({ type: 'union', members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })] }),
        }),
      ],
    })

    expect(zodPrinter().print(node)).toBe('z.object({ id: z.number(), label: z.union([z.string(), z.number()]) })')
  })

  it('dispatches overrides before nodes handlers', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
      },
      overrides: {
        string() {
          return 'z.string().trim()'
        },
      },
    }))

    expect(zodPrinter().print(createSchema({ type: 'string' }))).toBe('z.string().trim()')
  })

  it('lets an override wrap the replaced handler via this.base()', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
      },
      overrides: {
        string(node) {
          return `${this.base(node)}.describe('wrapped')`
        },
      },
    }))

    expect(zodPrinter().print(createSchema({ type: 'string' }))).toBe("z.string().describe('wrapped')")
  })

  it('dispatches nested nodes through overrides when a base handler recurses', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
        object(node) {
          const props = node.properties.map((p) => `${p.name}: ${this.transform(p.schema)}`).join(', ')
          return `z.object({ ${props} })`
        },
      },
      overrides: {
        string(node) {
          return `${this.base(node)}.min(1)`
        },
      },
    }))

    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({
          name: 'label',
          schema: createSchema({ type: 'string' }),
        }),
      ],
    })

    expect(zodPrinter().print(node)).toBe('z.object({ label: z.string().min(1) })')
  })

  it('returns null from this.base() when no base handler exists for the type', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {},
      overrides: {
        string(node) {
          return this.base(node) ?? 'z.string()'
        },
      },
    }))

    expect(zodPrinter().print(createSchema({ type: 'string' }))).toBe('z.string()')
  })

  it('returns a Printer typed by the factory name, options and output', () => {
    type P = PrinterFactoryOptions<'zod', object, string>
    const zodPrinter = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {},
    }))
    const printer = zodPrinter()

    expectTypeOf(printer.name).toEqualTypeOf<'zod'>()
    expectTypeOf(printer.options).toEqualTypeOf<object>()
    expectTypeOf(printer.print(createSchema({ type: 'string' }))).toEqualTypeOf<string | null>()
  })

  describe('this.import', () => {
    type P = PrinterFactoryOptions<'zod', object, string>
    const codec = createImport({ name: ['myCodec'], path: 'my-codec/zod' })

    const build = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          this.import(codec)
          return 'myCodec.string()'
        },
      },
    }))

    it('collects imports declared by handlers and clears them once taken', () => {
      const printer = build()

      printer.print(createSchema({ type: 'string' }))

      expect(printer.drainImports()).toStrictEqual([codec])
      expect(printer.drainImports()).toStrictEqual([])
    })

    it('keeps the imports of each printer instance separate', () => {
      const [a, b] = [build(), build()]

      a.print(createSchema({ type: 'string' }))

      expect(b.drainImports()).toStrictEqual([])
    })

    it('is available to overrides', () => {
      const printer = createPrinter<P>(() => ({
        name: 'zod',
        options: {},
        nodes: { string: () => 'z.string()' },
        overrides: {
          string() {
            this.import(codec)
            return this.base(createSchema({ type: 'string' }))
          },
        },
      }))()

      printer.print(createSchema({ type: 'string' }))

      expect(printer.drainImports()).toStrictEqual([codec])
    })
  })
})

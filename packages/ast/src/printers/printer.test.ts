import { describe, expect, expectTypeOf, it } from 'vitest'
import { createProperty, createSchema } from '../factory.ts'
import type { PrinterFactoryOptions } from './printer.ts'
import { definePrinter } from './printer.ts'

describe('definePrinter', () => {
  type P = PrinterFactoryOptions<'zod', { strict?: boolean }, string>

  const zodPrinter = definePrinter<P>((options) => {
    return { name: 'zod', options, nodes: {} }
  })

  it('returns a printer with the provided name and resolved options', () => {
    const printer = zodPrinter({ strict: false })

    expect(printer.name).toBe('zod')
    expect(printer.options).toEqual({ strict: false })
  })

  it('returns undefined when no node handler matches', () => {
    expect(zodPrinter().print(createSchema({ type: 'string' }))).toBeNull()
  })

  it('dispatches print() to the matching node handler', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = definePrinter<P>(() => ({
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

    const zodPrinter = definePrinter<P>((options) => {
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

  it('supports recursive this.print() for object properties', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = definePrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
        integer() {
          return 'z.number()'
        },
        object(node) {
          const props = node.properties.map((p) => `${p.name}: ${this.print(p.schema)}`).join(', ')
          return `z.object({ ${props} })`
        },
      },
    }))

    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) }),
        createProperty({ name: 'label', schema: createSchema({ type: 'string' }) }),
      ],
    })

    expect(zodPrinter().print(node)).toBe('z.object({ id: z.number(), label: z.string() })')
  })

  it('supports recursive this.print() for union members', () => {
    type P = PrinterFactoryOptions<'zod', object, string>

    const zodPrinter = definePrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          return 'z.string()'
        },
        number() {
          return 'z.number()'
        },
        union(node) {
          const members = node.members?.map((m) => this.print(m)).filter(Boolean) ?? []
          return `z.union([${members.join(', ')}])`
        },
      },
    }))

    const node = createSchema({
      type: 'union',
      members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
    })

    expect(zodPrinter().print(node)).toBe('z.union([z.string(), z.number()])')
  })

  it('infers the Printer type correctly', () => {
    type P = PrinterFactoryOptions<'zod', object, string>
    const zodPrinter = definePrinter<P>(() => ({ name: 'zod', options: {}, nodes: {} }))
    const printer = zodPrinter()

    expectTypeOf(printer.name).toEqualTypeOf<'zod'>()
    expectTypeOf(printer.options).toEqualTypeOf<object>()
    expectTypeOf(printer.print(createSchema({ type: 'string' }))).toEqualTypeOf<string | null | undefined>()
  })
})

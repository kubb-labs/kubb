import { describe, expect, it } from 'vitest'
import { createImport } from './nodes/file.ts'
import { createProperty } from './nodes/property.ts'
import { createSchema } from './nodes/schema.ts'
import type { PrinterFactoryOptions } from './createPrinter.ts'
import { createPrinter } from './createPrinter.ts'

describe('createPrinter', () => {
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
  })
  describe('options passed to this.transform', () => {
    type P = PrinterFactoryOptions<'zod', { depth: number; label?: string }, string>

    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({ name: 'a', schema: createSchema({ type: 'string' }) }),
        createProperty({ name: 'b', schema: createSchema({ type: 'string' }) }),
      ],
    })

    it('reach the child without leaking to siblings or the parent', () => {
      const printer = createPrinter<P>(() => ({
        name: 'zod',
        options: { depth: 0 },
        nodes: {
          string() {
            return `${this.options.label ?? '-'}@${this.options.depth}`
          },
          object(n) {
            const [a, b] = n.properties.map((p) => p.schema)
            return `${this.transform(a!, { depth: this.options.depth + 1, label: 'a' })} ${this.transform(b!)} ${this.options.label ?? '-'}@${this.options.depth}`
          },
        },
      }))()

      expect(printer.print(node)).toBe('a@1 -@0 -@0')
      expect(printer.options).toStrictEqual({ depth: 0 })
    })

    it('are honored by this.base and seen by an override reading this.options', () => {
      const printer = createPrinter<P>(() => ({
        name: 'zod',
        options: { depth: 0 },
        nodes: {
          string() {
            return `base:${this.options.label}`
          },
          object(n) {
            return n.properties.map((p) => this.transform(p.schema, { label: p.name })).join(' ')
          },
        },
        overrides: {
          string(n) {
            return `${this.options.label}|${this.base(n, { label: 'x' })}`
          },
        },
      }))()

      expect(printer.print(node)).toBe('a|base:x b|base:x')
    })

    it('merge over this.options as the handler last set it', () => {
      const printer = createPrinter<P>(() => ({
        name: 'zod',
        options: { depth: 0 },
        nodes: {
          string() {
            return `${this.options.label}@${this.options.depth}`
          },
          object(n) {
            this.options = { ...this.options, depth: 5 }
            return this.transform(n.properties[0]!.schema, { label: 'a' })
          },
        },
      }))()

      expect(printer.print(node)).toBe('a@5')
    })

    it('are accepted by the public transform and print', () => {
      const printer = createPrinter<P>(() => ({
        name: 'zod',
        options: { depth: 0 },
        nodes: {
          string() {
            return `${this.options.depth}`
          },
        },
        print(n) {
          return `print:${this.transform(n)}`
        },
      }))()

      expect(printer.transform(createSchema({ type: 'string' }), { depth: 2 })).toBe('2')
      expect(printer.print(createSchema({ type: 'string' }), { depth: 3 })).toBe('print:3')
      expect(printer.print(createSchema({ type: 'string' }))).toBe('print:0')
    })
  })

  it('sets this.parent to the calling node and leaves it undefined at the root', () => {
    type P = PrinterFactoryOptions<'zod', object, string>
    const parents: Array<string | undefined> = []

    const printer = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          parents.push(this.parent?.type)
          return 'z.string()'
        },
        array(n) {
          parents.push(this.parent?.type)
          return `z.array(${this.transform(n.items![0]!)})`
        },
      },
      overrides: {
        array(n) {
          return this.base(n)
        },
      },
    }))()

    printer.print(createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }))

    expect(parents).toStrictEqual([undefined, 'array'])
  })

  it('drains imports declared by nested handlers', () => {
    type P = PrinterFactoryOptions<'zod', object, string>
    const codec = createImport({ name: ['myCodec'], path: 'my-codec/zod' })

    const printer = createPrinter<P>(() => ({
      name: 'zod',
      options: {},
      nodes: {
        string() {
          this.import(codec)
          return 'myCodec.string()'
        },
        array(n) {
          return `z.array(${this.transform(n.items![0]!, {})})`
        },
      },
    }))()

    printer.print(createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }))

    expect(printer.drainImports()).toStrictEqual([codec])
  })

  it('merges options with with() without rerunning the builder', () => {
    type P = PrinterFactoryOptions<'zod', { prefix?: string }, string>
    let builds = 0
    const printer = createPrinter<P>((options) => {
      builds++
      return {
        name: 'zod',
        options,
        nodes: {
          string() {
            return `${this.options.prefix}.string()`
          },
        },
      }
    })({ prefix: 'z' })

    const bound = printer.with({ prefix: 'v' })

    expect(bound.options).toStrictEqual({ prefix: 'v' })
    expect(bound.print(createSchema({ type: 'string' }))).toBe('v.string()')
    expect(printer.print(createSchema({ type: 'string' }))).toBe('z.string()')
    expect(builds).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import { createFunctionParameter, createFunctionParameters, createObjectBindingParameter } from './factory.ts'
import { defineFunctionPrinter, functionPrinter } from './functionPrinter.ts'

describe('functionPrinter — declaration', () => {
  const printer = functionPrinter({ mode: 'declaration' })

  it('renders a required typed param', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'petId', type: 'string', optional: false })],
    })

    expect(printer.print(sig)).toBe('petId: string')
  })

  it('renders an optional typed param', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'params', type: 'QueryParams', optional: true })],
    })

    expect(printer.print(sig)).toBe('params?: QueryParams')
  })

  it('renders a param with default', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'config', type: 'RequestConfig', optional: false, default: '{}' })],
    })

    expect(printer.print(sig)).toBe('config: RequestConfig = {}')
  })

  it('renders a spread param', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'args', type: 'string[]', optional: false, rest: true })],
    })

    expect(printer.print(sig)).toBe('...args: string[]')
  })

  it('sorts required → optional → has-default', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'config', type: 'Config', optional: false, default: '{}' }),
        createFunctionParameter({ name: 'params', type: 'Params', optional: true }),
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, params?: Params, config: Config = {}')
  })

  it('always sorts rest parameters last', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'args', type: 'string[]', rest: true }),
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, ...args: string[]')
  })

  it('renders an object param with auto-computed type', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [
            createFunctionParameter({ name: 'id', type: 'string', optional: false }),
            createFunctionParameter({ name: 'name', type: 'string', optional: true }),
          ],
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}')
  })

  it('renders an object param with explicit type override', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [createFunctionParameter({ name: 'data', optional: false })],
          type: 'PetData',
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ data }: PetData = {}')
  })

  it('renders inline (spread) object param as top-level params', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [
            createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
            createFunctionParameter({ name: 'ownerId', type: 'number', optional: false }),
          ],
          inline: true,
        }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, ownerId: number')
  })

  it('mixes object param and simple params correctly', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [
            createFunctionParameter({ name: 'id', type: 'string', optional: false }),
            createFunctionParameter({ name: 'name', type: 'string', optional: true }),
          ],
          default: '{}',
        }),
        createFunctionParameter({ name: 'config', type: 'RequestConfig', optional: false, default: '{}' }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}, config: RequestConfig = {}')
  })
})

describe('functionPrinter — call', () => {
  const printer = functionPrinter({ mode: 'call' })

  it('renders simple param names only', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
        createFunctionParameter({ name: 'config', type: 'RequestConfig', optional: false, default: '{}' }),
      ],
    })

    expect(printer.print(sig)).toBe('petId, config')
  })

  it('renders object param as { key1, key2 }', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [createFunctionParameter({ name: 'method', optional: false }), createFunctionParameter({ name: 'url', optional: false })],
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ method, url }')
  })

  it('renders inline object param as individual args', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [createFunctionParameter({ name: 'petId', optional: false })],
          inline: true,
        }),
      ],
    })

    expect(printer.print(sig)).toBe('petId')
  })
})

describe('functionPrinter — keys', () => {
  const printer = functionPrinter({ mode: 'keys' })

  it('returns comma-separated names', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
        createFunctionParameter({ name: 'config', type: 'Config', optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId, config')
  })

  it('wraps object param keys in braces', () => {
    const sig = createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: [createFunctionParameter({ name: 'id', optional: false }), createFunctionParameter({ name: 'name', optional: false })],
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }')
  })
})

describe('functionPrinter — values', () => {
  const printer = functionPrinter({ mode: 'values' })

  it('returns names for simple params', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'petId', type: 'string', optional: false })],
    })

    expect(printer.print(sig)).toBe('petId')
  })
})

describe('functionPrinter — transform options', () => {
  it('applies transformName in declaration mode', () => {
    const printer = functionPrinter({
      mode: 'declaration',
      transformName: (n) => n.toUpperCase(),
    })
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'petId', type: 'string', optional: false })],
    })

    expect(printer.print(sig)).toBe('PETID: string')
  })

  it('applies transformType in declaration mode', () => {
    const printer = functionPrinter({
      mode: 'declaration',
      transformType: (t) => `Partial<${t}>`,
    })
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'config', type: 'Config', optional: false })],
    })

    expect(printer.print(sig)).toBe('config: Partial<Config>')
  })
})

describe('defineFunctionPrinter', () => {
  it('allows building a custom printer with defineFunctionPrinter', () => {
    type UpperPrinter = { name: 'upper'; options: { mode: 'declaration' }; output: string; printOutput: string }

    const upperPrinter = defineFunctionPrinter<UpperPrinter>((options) => ({
      name: 'upper',
      options,
      nodes: {
        functionParameter(node) {
          return node.name.toUpperCase()
        },
        objectBindingParameter(node) {
          return `{ ${node.properties.map((p) => p.name.toUpperCase()).join(', ')} }`
        },
        functionParameters(node) {
          return node.params
            .map((p) => this.print(p))
            .filter(Boolean)
            .join(' | ')
        },
      },
    }))

    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
        createFunctionParameter({ name: 'config', type: 'Config', optional: false }),
      ],
    })

    const printer = upperPrinter({ mode: 'declaration' })

    expect(printer.name).toBe('upper')
    expect(printer.print(sig)).toBe('PETID | CONFIG')
  })

  it('exposes this.print for recursive dispatch in handlers', () => {
    type RecursivePrinter = { name: 'rec'; options: object; output: string; printOutput: string }

    const recPrinter = defineFunctionPrinter<RecursivePrinter>((options) => ({
      name: 'rec',
      options,
      nodes: {
        functionParameter(node) {
          return `[${node.name}]`
        },
        objectBindingParameter(node) {
          // Use this.print to recurse into child params
          return `{${node.properties.map((p) => this.print(p)).join('+')}}`
        },
        functionParameters(node) {
          return node.params
            .map((p) => this.print(p))
            .filter(Boolean)
            .join('-')
        },
      },
    }))

    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'a', optional: false }),
        createObjectBindingParameter({
          properties: [createFunctionParameter({ name: 'b', optional: false }), createFunctionParameter({ name: 'c', optional: false })],
        }),
      ],
    })

    const printer = recPrinter({})

    expect(printer.print(sig)).toBe('[a]-{[b]+[c]}')
  })
})

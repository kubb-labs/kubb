import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { defineFunctionPrinter, functionPrinter } from './functionPrinter.ts'

describe('functionPrinter in declaration mode', () => {
  const printer = functionPrinter({ mode: 'declaration' })

  it('prints required typed parameters as `name: type`', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false })],
    })

    expect(printer.print(sig)).toBe('petId: string')
  })

  it('prints optional typed parameters as `name?: type`', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'params', type: ast.createParamsType({ variant: 'reference', name: 'QueryParams' }), optional: true })],
    })

    expect(printer.print(sig)).toBe('params?: QueryParams')
  })

  it('prints defaulted typed parameters as `name: type = default`', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({
          name: 'config',
          type: ast.createParamsType({ variant: 'reference', name: 'RequestConfig' }),
          optional: false,
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('config: RequestConfig = {}')
  })

  it('prints rest parameters with spread syntax', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'args', type: ast.createParamsType({ variant: 'reference', name: 'string[]' }), optional: false, rest: true }),
      ],
    })

    expect(printer.print(sig)).toBe('...args: string[]')
  })

  it('orders parameters as required, optional, then defaulted', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'config', type: ast.createParamsType({ variant: 'reference', name: 'Config' }), optional: false, default: '{}' }),
        ast.createFunctionParameter({ name: 'params', type: ast.createParamsType({ variant: 'reference', name: 'Params' }), optional: true }),
        ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, params?: Params, config: Config = {}')
  })

  it('always places rest parameters last', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'args', type: ast.createParamsType({ variant: 'reference', name: 'string[]' }), rest: true }),
        ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, ...args: string[]')
  })

  it('prints object binding parameters with inferred inline object types', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [
            ast.createFunctionParameter({ name: 'id', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
            ast.createFunctionParameter({ name: 'name', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: true }),
          ],
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}')
  })

  it('prints object binding parameters with explicit type overrides', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'data', optional: false })],
          type: ast.createParamsType({ variant: 'reference', name: 'PetData' }),
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ data }: PetData = {}')
  })

  it('prints inline object binding parameters as top-level parameters', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [
            ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
            ast.createFunctionParameter({ name: 'ownerId', type: ast.createParamsType({ variant: 'reference', name: 'number' }), optional: false }),
          ],
          inline: true,
        }),
      ],
    })

    expect(printer.print(sig)).toBe('petId: string, ownerId: number')
  })

  it('prints mixed object and simple parameters in stable order', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [
            ast.createFunctionParameter({ name: 'id', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
            ast.createFunctionParameter({ name: 'name', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: true }),
          ],
          default: '{}',
        }),
        ast.createFunctionParameter({
          name: 'config',
          type: ast.createParamsType({ variant: 'reference', name: 'RequestConfig' }),
          optional: false,
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}, config: RequestConfig = {}')
  })

  it('prints default-only parameters without a type annotation', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'config', default: '{}' })],
    })

    expect(printer.print(sig)).toBe('config = {}')
  })

  it('omits empty object binding parameters from the final signature', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createParameterGroup({ properties: [] })],
    })

    expect(printer.print(sig)).toBe('')
  })
})

describe('functionPrinter() in call mode', () => {
  const printer = functionPrinter({ mode: 'call' })

  it('prints simple parameter names only', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
        ast.createFunctionParameter({
          name: 'config',
          type: ast.createParamsType({ variant: 'reference', name: 'RequestConfig' }),
          optional: false,
          default: '{}',
        }),
      ],
    })

    expect(printer.print(sig)).toBe('petId, config')
  })

  it('prints object binding parameters as `{ key1, key2 }`', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'method', optional: false }), ast.createFunctionParameter({ name: 'url', optional: false })],
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ method, url }')
  })

  it('prints inline object binding parameters as individual arguments', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'petId', optional: false })],
          inline: true,
        }),
      ],
    })

    expect(printer.print(sig)).toBe('petId')
  })

  it('keeps spread syntax for rest parameters', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'args', rest: true })],
    })

    expect(printer.print(sig)).toBe('...args')
  })
})

describe('functionPrinter() in keys mode', () => {
  const printer = functionPrinter({ mode: 'keys' })

  it('prints comma-separated parameter names', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
        ast.createFunctionParameter({ name: 'config', type: ast.createParamsType({ variant: 'reference', name: 'Config' }), optional: false }),
      ],
    })

    expect(printer.print(sig)).toBe('petId, config')
  })

  it('wraps object binding parameter keys in braces', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'id', optional: false }), ast.createFunctionParameter({ name: 'name', optional: false })],
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }')
  })
})

describe('functionPrinter() in values mode', () => {
  const printer = functionPrinter({ mode: 'values' })

  it('prints names for simple parameters', () => {
    const sig = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false })],
    })

    expect(printer.print(sig)).toBe('petId')
  })

  it('prints object binding parameters in braces', () => {
    const sig = ast.createFunctionParameters({
      params: [
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'id', optional: false }), ast.createFunctionParameter({ name: 'name', optional: false })],
        }),
      ],
    })

    expect(printer.print(sig)).toBe('{ id, name }')
  })
})

describe('functionPrinter() transform options', () => {
  it.each([
    {
      label: 'transformName',
      options: { mode: 'declaration' as const, transformName: (n: string) => n.toUpperCase() },
      param: ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
      expected: 'PETID: string',
    },
    {
      label: 'transformType',
      options: { mode: 'declaration' as const, transformType: (t: string) => `Partial<${t}>` },
      param: ast.createFunctionParameter({ name: 'config', type: ast.createParamsType({ variant: 'reference', name: 'Config' }), optional: false }),
      expected: 'config: Partial<Config>',
    },
  ])('applies $label in declaration mode', ({ options, param, expected }) => {
    const printer = functionPrinter(options)
    const sig = ast.createFunctionParameters({
      params: [param],
    })

    expect(printer.print(sig)).toBe(expected)
  })
})

describe('defineFunctionPrinter()', () => {
  it('builds a custom function-node printer', () => {
    type UpperPrinter = { name: 'upper'; options: { mode: 'declaration' }; output: string; printOutput: string }

    const upperPrinter = defineFunctionPrinter<UpperPrinter>((options) => ({
      name: 'upper',
      options,
      nodes: {
        functionParameter(node) {
          return node.name.toUpperCase()
        },
        parameterGroup(node) {
          return `{ ${node.properties.map((p) => p.name.toUpperCase()).join(', ')} }`
        },
        functionParameters(node) {
          return node.params
            .map((p) => this.transform(p))
            .filter(Boolean)
            .join(' | ')
        },
      },
    }))

    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'petId', type: ast.createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
        ast.createFunctionParameter({ name: 'config', type: ast.createParamsType({ variant: 'reference', name: 'Config' }), optional: false }),
      ],
    })

    const printer = upperPrinter({ mode: 'declaration' })

    expect(printer.name).toBe('upper')
    expect(printer.print(sig)).toBe('PETID | CONFIG')
  })

  it('exposes recursive dispatch via this.print inside handlers', () => {
    type RecursivePrinter = { name: 'rec'; options: object; output: string; printOutput: string }

    const recPrinter = defineFunctionPrinter<RecursivePrinter>((options) => ({
      name: 'rec',
      options,
      nodes: {
        functionParameter(node) {
          return `[${node.name}]`
        },
        parameterGroup(node) {
          return `{${node.properties.map((p) => this.transform(p)).join('+')}}`
        },
        functionParameters(node) {
          return node.params
            .map((p) => this.transform(p))
            .filter(Boolean)
            .join('-')
        },
      },
    }))

    const sig = ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({ name: 'a', optional: false }),
        ast.createParameterGroup({
          properties: [ast.createFunctionParameter({ name: 'b', optional: false }), ast.createFunctionParameter({ name: 'c', optional: false })],
        }),
      ],
    })

    const printer = recPrinter({})

    expect(printer.print(sig)).toBe('[a]-{[b]+[c]}')
  })
})

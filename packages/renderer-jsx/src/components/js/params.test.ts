import { describe, expect, it } from 'vitest'
import { ast } from '@kubb/ast'
import { printParams as print, printParamType as renderType } from './params.ts'

const { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createObjectBindingPattern, createTypeLiteral } = ast.factory
type FunctionParameterNode = ast.FunctionParameterNode
type FunctionParametersNode = ast.FunctionParametersNode
type TypeExpression = ast.TypeExpression

/**
 * Builds a destructured group parameter with an explicit object-binding name and
 * type, used to cover the cases `createFunctionParameter({ properties })` cannot
 * express (a reference type, or an untyped binding).
 */
function group(elements: Array<{ name: string; propertyName?: string }>, type?: TypeExpression, default_?: string): FunctionParameterNode {
  return createFunctionParameter({ name: createObjectBindingPattern({ elements }), type, default: default_, optional: false })
}

describe('renderType', () => {
  it('returns a string reference as-is', () => {
    expect(renderType('QueryParams')).toBe('QueryParams')
  })

  it('renders an indexed access type', () => {
    expect(renderType(createIndexedAccessType({ target: 'GetPetPathParams', key: 'petId' }))).toBe("GetPetPathParams['petId']")
  })

  it('renders a type literal with optional members', () => {
    const type = createTypeLiteral({
      members: [
        { name: 'petId', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: true },
      ],
    })
    expect(renderType(type)).toBe('{ petId: string; name?: string }')
  })
})

describe('print in declaration mode', () => {
  const printer = { print: (node: FunctionParametersNode) => print(node, 'declaration') }

  it('prints required typed parameters as `name: type`', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'petId', type: 'string', optional: false })] })
    expect(printer.print(sig)).toBe('petId: string')
  })

  it('prints defaulted typed parameters as `name: type = default`', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' })],
    })
    expect(printer.print(sig)).toBe('config: RequestConfig = {}')
  })

  it('prints rest parameters with spread syntax', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'args', type: 'string[]', rest: true })] })
    expect(printer.print(sig)).toBe('...args: string[]')
  })

  it('orders parameters as required, optional, then defaulted', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'config', type: 'Config', default: '{}' }),
        createFunctionParameter({ name: 'params', type: 'Params', optional: true }),
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })
    expect(printer.print(sig)).toBe('petId: string, params?: Params, config: Config = {}')
  })

  it('always places rest parameters last', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'args', type: 'string[]', rest: true }),
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })
    expect(printer.print(sig)).toBe('petId: string, ...args: string[]')
  })

  it('prints a destructured group with an inferred inline object type', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: true },
          ],
          default: '{}',
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}')
  })

  it('orders required group members before optional ones', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({
          properties: [
            { name: 'name', type: 'string', optional: true },
            { name: 'id', type: 'string', optional: false },
          ],
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string }')
  })

  it('appends `= {}` when every group member is optional', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({
          properties: [
            { name: 'a', type: 'string', optional: true },
            { name: 'b', type: 'string', optional: true },
          ],
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ a, b }: { a?: string; b?: string } = {}')
  })

  it('prints a group with an explicit reference type', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'data' }], 'PetData', '{}')] })
    expect(printer.print(sig)).toBe('{ data }: PetData = {}')
  })

  it('prints mixed group and simple parameters in a stable order', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: true },
          ],
          default: '{}',
        }),
        createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}, config: RequestConfig = {}')
  })

  it('prints default-only parameters without a type annotation', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'config', default: '{}' })] })
    expect(printer.print(sig)).toBe('config = {}')
  })

  it('prints an empty parameter list as an empty string', () => {
    expect(printer.print(createFunctionParameters({ params: [] }))).toBe('')
  })

  it('prints an untyped group as a bare binding', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'method' }, { name: 'url' }])] })
    expect(printer.print(sig)).toBe('{ method, url }')
  })

  it('prints an untyped group with a default', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'method' }], undefined, '{}')] })
    expect(printer.print(sig)).toBe('{ method } = {}')
  })

  it('renders a renamed binding element as `source: local`', () => {
    const type = createTypeLiteral({ members: [{ name: 'petId', type: 'string', optional: false }] })
    const sig = createFunctionParameters({ params: [group([{ name: 'id', propertyName: 'petId' }], type)] })
    expect(printer.print(sig)).toBe('{ petId: id }: { petId: string }')
  })
})

describe('print in call mode', () => {
  const printer = { print: (node: FunctionParametersNode) => print(node, 'call') }

  it('prints simple parameter names only', () => {
    const sig = createFunctionParameters({
      params: [
        createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
        createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' }),
      ],
    })
    expect(printer.print(sig)).toBe('petId, config')
  })

  it('prints a destructured group as `{ key1, key2 }`', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'method' }, { name: 'url' }])] })
    expect(printer.print(sig)).toBe('{ method, url }')
  })

  it('keeps spread syntax for rest parameters', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'args', rest: true })] })
    expect(printer.print(sig)).toBe('...args')
  })

  it('forwards a renamed binding as `source: local`', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'id', propertyName: 'petId' }, { name: 'url' }])] })
    expect(printer.print(sig)).toBe('{ petId: id, url }')
  })

  it('keeps a required group with a reference type before optional parameters', () => {
    const sig = createFunctionParameters({
      params: [createFunctionParameter({ name: 'opt', type: 'X', optional: true }), group([{ name: 'data' }], 'PetData')],
    })
    expect(print(sig, 'declaration')).toBe('{ data }: PetData, opt?: X')
  })

  it('keeps the default of an optional parameter', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'a', type: 'X', optional: true, default: '1' })] })
    expect(print(sig, 'declaration')).toBe('a: X = 1')
  })

  it('keeps the ? of an untyped optional parameter', () => {
    const sig = createFunctionParameters({ params: [createFunctionParameter({ name: 'raw', optional: true })] })
    expect(print(sig, 'declaration')).toBe('raw?')
  })

  it('escapes quotes in an indexed-access key', () => {
    expect(renderType(createIndexedAccessType({ target: 'Params', key: "owner's-id" }))).toBe("Params['owner\\'s-id']")
  })

  it('quotes a renamed binding key that is not an identifier', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'contentType', propertyName: 'content-type' }])] })
    expect(print(sig, 'call')).toBe('{ "content-type": contentType }')
  })

  it('pairs bindings with type members by name', () => {
    const type = createTypeLiteral({
      members: [
        { name: 'label', type: 'string', optional: true },
        { name: 'id', type: 'number' },
      ],
    })
    const sig = createFunctionParameters({ params: [group([{ name: 'id' }, { name: 'label' }], type)] })
    expect(print(sig, 'declaration')).toBe('{ id, label }: { id: number; label?: string }')
  })

  it('escapes line breaks in an indexed-access key', () => {
    expect(renderType(createIndexedAccessType({ target: 'Params', key: 'a\nb\rc' }))).toBe("Params['a\\nb\\rc']")
  })

  it('keeps an empty renamed binding key', () => {
    const sig = createFunctionParameters({ params: [group([{ name: 'value', propertyName: '' }])] })
    expect(print(sig, 'call')).toBe('{ "": value }')
    expect(print(sig, 'declaration')).toBe('{ "": value }')
  })
})

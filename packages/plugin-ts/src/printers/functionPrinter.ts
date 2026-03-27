import type { PrinterFactoryOptions } from '@kubb/ast'
import { createPrinterFactory } from '@kubb/ast'
import type { FunctionNode, FunctionNodeType, FunctionParameterNode, FunctionParametersNode, ParameterGroupNode, TypeNode } from '@kubb/ast/types'

/**
 * Maps each function-printer handler key to its concrete node type.
 */
export type FunctionNodeByType = {
  functionParameter: FunctionParameterNode
  parameterGroup: ParameterGroupNode
  functionParameters: FunctionParametersNode
  type: TypeNode
}

const kindToHandlerKey = {
  FunctionParameter: 'functionParameter',
  ParameterGroup: 'parameterGroup',
  FunctionParameters: 'functionParameters',
  Type: 'type',
} satisfies Record<string, FunctionNodeType>

/**
 * Creates a function-parameter printer factory.
 *
 * Uses `createPrinterFactory` and dispatches handlers by `node.kind`
 * (for function nodes) rather than by `node.type` (for schema nodes).
 */
export const defineFunctionPrinter = createPrinterFactory<FunctionNode, FunctionNodeType, FunctionNodeByType>((node) => kindToHandlerKey[node.kind])

export type FunctionPrinterOptions = {
  /**
   * Rendering modes supported by `functionPrinter`.
   *
   * | Mode          | Output example                              | Use case                        |
   * |---------------|---------------------------------------------|---------------------------------|
   * | `declaration` | `id: string, config: Config = {}`           | Function parameter declaration |
   * | `call`        | `id, { method, url }`                       | Function call arguments |
   * | `keys`        | `{ id, config }`                            | Key names only (destructuring) |
   * | `values`      | `{ id: id, config: config }`                | Key/value object entries |
   */
  mode: 'declaration' | 'call' | 'keys' | 'values'
  /**
   * Optional transformation applied to every parameter name before printing.
   */
  transformName?: (name: string) => string
  /**
   * Optional transformation applied to every type string before printing.
   */
  transformType?: (type: string) => string
}

type DefaultPrinter = PrinterFactoryOptions<'functionParameters', FunctionPrinterOptions, string>

function rank(param: FunctionParameterNode | ParameterGroupNode): number {
  if (param.kind === 'ParameterGroup') {
    if (param.default) return 2
    const isOptional = param.optional ?? param.properties.every((p) => p.optional || p.default !== undefined)
    return isOptional ? 1 : 0
  }
  if (param.rest) return 3
  if (param.default) return 2
  return param.optional ? 1 : 0
}

function sortParams(params: Array<FunctionParameterNode | ParameterGroupNode>): Array<FunctionParameterNode | ParameterGroupNode> {
  return [...params].sort((a, b) => rank(a) - rank(b))
}

function sortChildParams(params: Array<FunctionParameterNode>): Array<FunctionParameterNode> {
  return [...params].sort((a, b) => rank(a) - rank(b))
}

/**
 * Default function-signature printer.
 * Covers the four standard output modes used across Kubb plugins.
 *
 * @example
 * ```ts
 * const printer = functionPrinter({ mode: 'declaration' })
 *
 * const sig = createFunctionParameters({
 *   params: [
 *     createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
 *     createFunctionParameter({ name: 'config', type: 'Config', optional: false, default: '{}' }),
 *   ],
 * })
 *
 * printer.print(sig)  // → "petId: string, config: Config = {}"
 * ```
 */
export const functionPrinter = defineFunctionPrinter<DefaultPrinter>((options) => ({
  name: 'functionParameters',
  options,
  nodes: {
    type(node) {
      if (node.variant === 'member') {
        return `${node.base}['${node.key}']`
      }
      const parts = (node as TypeNode & { variant: 'struct' }).properties.map((p) => (p.optional ? `${p.name}?: ${p.type}` : `${p.name}: ${p.type}`))
      return `{ ${parts.join('; ')} }`
    },
    functionParameter(node) {
      const { mode, transformName, transformType } = this.options
      const name = transformName ? transformName(node.name) : node.name

      const rawType = node.type && typeof node.type === 'object' ? this.transform(node.type) : node.type
      const type = rawType != null && transformType ? transformType(rawType) : rawType

      if (mode === 'keys' || mode === 'values') {
        return node.rest ? `...${name}` : name
      }

      if (mode === 'call') {
        return node.rest ? `...${name}` : name
      }

      if (node.rest) {
        return type ? `...${name}: ${type}` : `...${name}`
      }
      if (type) {
        if (node.optional) return `${name}?: ${type}`
        return node.default ? `${name}: ${type} = ${node.default}` : `${name}: ${type}`
      }
      return node.default ? `${name} = ${node.default}` : name
    },
    parameterGroup(node) {
      const { mode, transformName, transformType } = this.options
      const sorted = sortChildParams(node.properties)
      const isOptional = node.optional ?? sorted.every((p) => p.optional || p.default !== undefined)

      if (node.inline) {
        return sorted
          .map((p) => this.transform(p))
          .filter(Boolean)
          .join(', ')
      }

      if (mode === 'keys' || mode === 'values') {
        const keys = sorted.map((p) => p.name).join(', ')
        return `{ ${keys} }`
      }

      if (mode === 'call') {
        const keys = sorted.map((p) => p.name).join(', ')
        return `{ ${keys} }`
      }

      const names = sorted.map((p) => {
        const n = transformName ? transformName(p.name) : p.name

        return n
      })

      const nameStr = names.length ? `{ ${names.join(', ')} }` : undefined
      if (!nameStr) return null

      let typeAnnotation: string | undefined = typeof node.type === 'string' ? node.type : undefined
      if (!typeAnnotation) {
        const typeParts = sorted
          .filter((p) => p.type)
          .map((p) => {
            const rawT = p.type && typeof p.type === 'object' ? this.transform(p.type) : p.type
            const t = rawT != null && transformType ? transformType(rawT) : rawT
            return p.optional || p.default !== undefined ? `${p.name}?: ${t}` : `${p.name}: ${t}`
          })
        typeAnnotation = typeParts.length ? `{ ${typeParts.join('; ')} }` : undefined
      }

      if (typeAnnotation) {
        if (isOptional) return `${nameStr}: ${typeAnnotation} = ${node.default ?? '{}'}`
        return node.default ? `${nameStr}: ${typeAnnotation} = ${node.default}` : `${nameStr}: ${typeAnnotation}`
      }

      return node.default ? `${nameStr} = ${node.default}` : nameStr
    },
    functionParameters(node) {
      const sorted = sortParams(node.params)

      return sorted
        .map((p) => this.transform(p))
        .filter(Boolean)
        .join(', ')
    },
  },
}))

import { camelCase, isValidVarName, pascalCase } from '@internals/utils'

import { createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { ParameterNode, PropertyNode, SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'
import { transform } from './visitor.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns `true` when a schema node will be represented as a plain string in generated code.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 */
export function isPlainStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}

/**
 * Transforms the `name` field of each parameter node according to the given casing strategy.
 *
 * The original `params` array is never mutated — a new array of cloned nodes is returned.
 * When no `casing` is provided the original array is returned as-is.
 *
 * Use this before passing parameters to schema builders so that property keys
 * in the generated output match the desired casing while the original
 * `OperationNode.parameters` array remains untouched for other consumers.
 */
export function applyParamsCasing(params: Array<ParameterNode>, casing: 'camelcase' | undefined): Array<ParameterNode> {
  if (!casing) {
    return params
  }

  return params.map((param) => {
    const transformed = casing === 'camelcase' || !isValidVarName(param.name) ? camelCase(param.name) : param.name

    return { ...param, name: transformed }
  })
}

/**
 * Builds an inline `ObjectSchemaNode` from a group of individual parameter nodes.
 *
 * Each parameter becomes an object property. Top-level unnamed `enum` schemas
 * on individual parameters are given an extracted name using `parentName` so they
 * are rendered as dedicated enum declarations in the output.
 *
 * @internal Used by `createLegacyOperationTransformer`.
 */
export function buildGroupedParamSchema(params: Array<ParameterNode>, parentName: string): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) => {
      let schema = param.schema
      if (narrowSchema(schema, 'enum') && !schema.name) {
        schema = { ...schema, name: pascalCase([parentName, param.name, 'enum'].join(' ')) }
      }

      return createProperty({ name: param.name, required: param.required, schema })
    }),
  })
}

/**
 * Names all unnamed `enum` nodes within a schema tree, based on the parent type name.
 *
 * - A top-level unnamed enum becomes `"<parentName>Enum"`.
 * - An unnamed enum nested inside a property `p` becomes `"<parentName><p.name>Enum"`.
 *
 * @internal Used by `createLegacyOperationTransformer`.
 */
export function nameEnumsInSchema(node: SchemaNode, parentName: string): SchemaNode {
  return transform(node, {
    schema(n) {
      if (n.type === 'enum' && !n.name) {
        return { ...n, name: pascalCase([parentName, 'enum'].join(' ')) }
      }

      return undefined
    },
    property(p: PropertyNode) {
      const enumNode = narrowSchema(p.schema, 'enum')
      if (enumNode && !enumNode.name) {
        return {
          ...p,
          schema: { ...enumNode, name: pascalCase([parentName, p.name, 'enum'].join(' ')) },
        }
      }

      return undefined
    },
  })
}

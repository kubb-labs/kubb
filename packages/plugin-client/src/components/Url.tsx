import { URLPath } from '@kubb/core/utils'

import { isAllOptional, type Operation, type SchemaObject } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { Const, File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types.ts'

/**
 * Determines the appropriate default value for a schema parameter.
 * - For array types: returns '[]'
 * - For union types (anyOf/oneOf):
 *   - If at least one variant has all-optional fields: returns '{}'
 *   - Otherwise: returns undefined (no default)
 * - For object types with optional fields: returns '{}'
 * - For primitive types (string, number, boolean): returns undefined (no default)
 * - For required types: returns undefined (no default)
 */
function getDefaultValue(schema?: SchemaObject): string | undefined {
  if (!schema) {
    return undefined
  }

  // For array types, use empty array as default
  if (schema.type === 'array') {
    return '[]'
  }

  // For union types (anyOf/oneOf), check if any variant could accept an empty object
  if (schema.anyOf || schema.oneOf) {
    const variants = schema.anyOf || schema.oneOf
    if (!Array.isArray(variants)) {
      return undefined
    }
    // Only provide default if at least one variant has all-optional fields
    const hasEmptyObjectVariant = variants.some((variant) => isAllOptional(variant))
    if (!hasEmptyObjectVariant) {
      return undefined
    }
    // At least one variant accepts empty object
    return '{}'
  }

  // For object types (or schemas with properties), use empty object as default
  if (schema.type === 'object' || schema.properties) {
    // Check if all properties are optional
    if (isAllOptional(schema)) {
      return '{}'
    }
    return undefined
  }

  // For other types (primitives like string, number, boolean), check if optional
  if (isAllOptional(schema)) {
    return '{}'
  }
  
  return undefined
}

type Props = {
  /**
   * Name of the function
   */
  name: string
  isExportable?: boolean
  isIndexable?: boolean

  baseURL: string | undefined
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  operation: Operation
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...pathParams,
        },
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          default: getDefaultValue(typeSchemas.pathParams?.schema),
        }
      : undefined,
  })
}

export function Url({
  name,
  isExportable = true,
  isIndexable = true,
  typeSchemas,
  baseURL,
  paramsType,
  paramsCasing,
  pathParamsType,
  operation,
}: Props): KubbNode {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={params.toConstructor()}>
        <Const name={'res'}>{`{ method: '${operation.method.toUpperCase()}', url: ${path.toTemplateString({ prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}

Url.getParams = getParams

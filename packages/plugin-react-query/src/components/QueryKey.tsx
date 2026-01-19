import { URLPath } from '@kubb/core/utils'
import { isAllOptional, isOptional, type Operation, type SchemaObject } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginReactQuery, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

/**
 * Determines the appropriate default value for a schema parameter.
 * - For array types: returns '[]'
 * - For union types (anyOf/oneOf) where no variant has all-optional fields: returns undefined (no default)
 * - For object types with optional fields: returns '{}'
 * - For required types: returns undefined (no default)
 */
function getDefaultValue(schema?: SchemaObject): string | undefined {
  if (!schema || !isOptional(schema)) {
    return undefined
  }

  // For array types, use empty array as default
  if (schema.type === 'array') {
    return '[]'
  }

  // For union types (anyOf/oneOf), check if any variant could accept an empty object
  if (schema.anyOf || schema.oneOf) {
    const variants = (schema.anyOf || schema.oneOf) as unknown[]
    // Only provide default if at least one variant has all-optional fields
    const hasEmptyObjectVariant = variants.some((variant) => isAllOptional(variant))
    if (!hasEmptyObjectVariant) {
      return undefined
    }
  }

  // Default for object types with optional fields
  return '{}'
}

function getParams({ pathParamsType, paramsCasing, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          default: getDefaultValue(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          default: getDefaultValue(typeSchemas.queryParams?.schema),
        }
      : undefined,
  })
}

const getTransformer: Transformer = ({ operation, schemas, casing }) => {
  const path = new URLPath(operation.path, { casing })
  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    schemas.queryParams?.name ? '...(params ? [params] : [])' : undefined,
    schemas.request?.name ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean)

  return keys
}

export function QueryKey({ name, typeSchemas, paramsCasing, pathParamsType, operation, typeName, transformer = getTransformer }: Props): KubbNode {
  const params = getParams({ pathParamsType, typeSchemas, paramsCasing })
  const keys = transformer({
    operation,
    schemas: typeSchemas,
    casing: paramsCasing,
  })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={params.toConstructor()} singleLine>
          {`[${keys.join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type name={typeName} export>
          {`ReturnType<typeof ${name}>`}
        </Type>
      </File.Source>
    </>
  )
}

QueryKey.getParams = getParams
QueryKey.getTransformer = getTransformer

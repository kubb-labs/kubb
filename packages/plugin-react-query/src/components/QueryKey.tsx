import { URLPath } from '@kubb/core/utils'
import { isOptional, type Operation } from '@kubb/oas'
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

function getParams({ pathParamsType, paramsCasing, typeSchemas }: GetParamsProps) {
  const pathParamsChildren = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

  const pathParamsParam = typeSchemas.pathParams?.name
    ? {
        mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
        children: pathParamsChildren,
      }
    : undefined

  const dataParam = typeSchemas.request?.name
    ? {
        type: typeSchemas.request?.name,
        optional: isOptional(typeSchemas.request?.schema),
      }
    : undefined

  const paramsParam = typeSchemas.queryParams?.name
    ? {
        type: typeSchemas.queryParams?.name,
        optional: isOptional(typeSchemas.queryParams?.schema),
      }
    : undefined

  // Check if all params are optional
  const allParamsOptional =
    (!dataParam || dataParam.optional) && 
    (!paramsParam || paramsParam.optional) && 
    Object.values(pathParamsChildren).every((child) => !child || child.optional)

  return FunctionParams.factory({
    pathParams: pathParamsParam,
    data: dataParam ? { ...dataParam, default: allParamsOptional ? '{}' : undefined } : undefined,
    params: paramsParam ? { ...paramsParam, default: allParamsOptional ? '{}' : undefined } : undefined,
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

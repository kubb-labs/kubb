import { URLPath } from '@internals/utils'
import { FunctionParams } from '@kubb/core'
import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { ParamsCasing, PathParamsType, Transformer } from '../types.ts'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: ParamsCasing
  pathParamsType: PathParamsType
  transformer: Transformer | undefined
}

type GetParamsProps = {
  paramsCasing: ParamsCasing
  pathParamsType: PathParamsType
  typeSchemas: OperationSchemas
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
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
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

export function QueryKey({ name, typeSchemas, paramsCasing, pathParamsType, operation, typeName, transformer = getTransformer }: Props): KubbReactNode {
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

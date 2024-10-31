import { URLPath } from '@kubb/core/utils'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginSwr, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true }),
    },
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

const getTransformer: Transformer = ({ operation, schemas }) => {
  const path = new URLPath(operation.path)
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

export function QueryKey({ name, typeSchemas, pathParamsType, operation, typeName, transformer = getTransformer }: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas })
  const keys = transformer({
    operation,
    schemas: typeSchemas,
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

import { FunctionParams, URLPath } from '@kubb/core/utils'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { File, Function, Type } from '@kubb/react'

import { type Operation, isRequired } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types'

type Props = {
  name: string
  typeName: string
  queryTypeName: string
  typedSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginReactQuery['resolvedOptions']['query']['pathParamsType']
  keysFn: (keys: unknown[]) => unknown[]
}

export function QueryKey({ name, typedSchemas, queryTypeName, pathParamsType, operation, typeName, keysFn }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withQueryParams = !!typedSchemas.queryParams?.name
  const withRequest = !!typedSchemas.request?.name

  params.add([
    ...(pathParamsType === 'object' ? [getASTParams(typedSchemas.pathParams, { typed: true })] : getASTParams(typedSchemas.pathParams, { typed: true })),
    {
      name: 'params',
      type: `${queryTypeName}["queryParams"]`,
      enabled: withQueryParams,
      required: isRequired(typedSchemas.queryParams?.schema),
    },
    {
      name: 'data',
      type: `${queryTypeName}["request"]`,
      enabled: withRequest,
      required: isRequired(typedSchemas.request?.schema),
    },
  ])

  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    withQueryParams ? '...(params ? [params] : [])' : undefined,
    withRequest ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean)

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={params.toString()} singleLine>
          {`[${keysFn(keys).join(', ')}] as const`}
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

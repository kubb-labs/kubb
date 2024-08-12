import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function, Type, useApp } from '@kubb/react'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'

import { isRequired } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types'
import { pluginTsName } from '@kubb/plugin-ts'

type Props = {
  name: string
  typeName: string
  keysFn: (keys: unknown[]) => unknown[]
}

export function QueryKey({ name, typeName, keysFn }: Props): ReactNode {
  const {
    plugin: {
      options: { pathParamsType },
    },
  } = useApp<PluginReactQuery>()
  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withQueryParams = !!schemas.queryParams?.name
  const withRequest = !!schemas.request?.name

  params.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams, { typed: true })] : getASTParams(schemas.pathParams, { typed: true })),
    {
      name: 'params',
      type: `${typeName}["queryParams"]`,
      enabled: withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'data',
      type: `${typeName}["request"]`,
      enabled: withRequest,
      required: isRequired(schemas.request?.schema),
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
      <Function.Arrow name={`${name}QueryKey`} export params={params.toString()} singleLine>
        {`[${keysFn(keys).join(', ')}] as const`}
      </Function.Arrow>

      <Type name={`${typeName}QueryKey`} export>
        {`ReturnType<typeof ${name}QueryKey>`}
      </Type>
    </>
  )
}

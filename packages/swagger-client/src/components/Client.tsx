import { FunctionParams } from '@kubb/core/utils'
import { URLPath } from '@kubb/core/utils'
import { useOperation, useResolveName, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'

import { ClientFunction } from './ClientFunction.tsx'

import type { KubbPlugin } from '@kubb/core'
import type { ReactNode } from 'react'
import type { Options as PluginOptions } from '../types.ts'

type Props = {
  pluginKey: KubbPlugin['key']
  dataReturnType?: PluginOptions['dataReturnType']
  pathParamsType?: PluginOptions['pathParamsType']
  /**
   * Will make it possible to override the default behaviour of ClientFunction
   */
  Component?: React.ComponentType<React.ComponentProps<typeof ClientFunction>>
}

export function Client({
  pluginKey,
  dataReturnType,
  pathParamsType,
  Component = ClientFunction,
}: Props): ReactNode {
  const params = new FunctionParams()
  const clientGenerics = new FunctionParams()

  const schemas = useSchemas()
  const operation = useOperation()
  const name = useResolveName({ pluginKey, type: 'function' })

  clientGenerics.add([{ type: schemas.response.name }, { type: schemas.request?.name, enabled: !!schemas.request?.name }])

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true, asObject: pathParamsType === 'object' }),
    {
      name: 'data',
      type: schemas.request?.name,
      enabled: !!schemas.request?.name,
      required: !!schemas.request?.schema.required?.length,
    },
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: !!schemas.headerParams?.name,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `Partial<Parameters<typeof client>[0]>`,
      default: '{}',
    },
  ])

  return (
    <Component
      name={name}
      clientGenerics={clientGenerics.toString()}
      dataReturnType={dataReturnType}
      params={params.toString()}
      returnType={dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
      method={operation.method}
      path={new URLPath(operation.path)}
      withParams={!!schemas.queryParams?.name}
      withData={!!schemas.request?.name}
      withHeaders={!!schemas.headerParams?.name}
      comments={getComments(operation)}
    />
  )
}

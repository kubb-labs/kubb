import { File, Function } from '@kubb/react'
import type { Client as BaseClient } from '@kubb/plugin-client/components'
import type React from 'react'
import { URLPath } from '@kubb/core/utils'
import type { Params } from '@kubb/react'
import { isOptional, getPathParams } from '@kubb/plugin-oas/utils'
import { getComments } from '@kubb/plugin-oas/utils'

export function Client({ name, options, typedSchemas, operation }: React.ComponentProps<typeof BaseClient>) {
  const path = new URLPath(operation.path)
  const params: Params = {
    pathParams: {
      mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typedSchemas.pathParams, { typed: true }),
    },
    data: typedSchemas.request?.name
      ? {
          type: typedSchemas.request?.name,
          optional: isOptional(typedSchemas.request?.schema),
        }
      : undefined,
    params: typedSchemas.queryParams?.name
      ? {
          type: typedSchemas.queryParams?.name,
          optional: isOptional(typedSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typedSchemas.headerParams?.name
      ? {
          type: typedSchemas.headerParams?.name,
          optional: isOptional(typedSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: 'Partial<Parameters<typeof client>[0]>',
      default: '{}',
    },
  }

  const clientParams = [path.template, typedSchemas.request ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

  return (
    <>
      <File.Import name="axios" path="axios" />
      <Function
        name={name}
        async
        export
        params={params}
        returnType={
          options.dataReturnType === 'data' ? `ResponseConfig<${typedSchemas.response.name}>["data"]` : `ResponseConfig<${typedSchemas.response.name}>`
        }
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`return axios.${operation.method}(${clientParams})`}
      </Function>
    </>
  )
}

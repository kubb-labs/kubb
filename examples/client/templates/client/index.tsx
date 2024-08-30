import { URLPath } from '@kubb/core/utils'
import type { Client as BaseClient } from '@kubb/plugin-client/components'
import { getPathParams, isOptional } from '@kubb/plugin-oas/utils'
import { getComments } from '@kubb/plugin-oas/utils'
import { File, Function, createFunctionParams } from '@kubb/react'
import type React from 'react'

export function Client({ name, options, typedSchemas, operation }: React.ComponentProps<typeof BaseClient>) {
  const path = new URLPath(operation.path)
  const params = createFunctionParams({
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
  })

  const clientParams = [path.template, typedSchemas.request ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

  return (
    <>
      <File.Import name="axios" path="axios" />
      <File.Source name={name} exportable isIndexable>
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
      </File.Source>
    </>
  )
}

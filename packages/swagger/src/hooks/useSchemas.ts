import transformers from '@kubb/core/transformers'
import { useApp } from '@kubb/react'

import type { OperationSchemas, PluginOptions } from '../types.ts'

export function useSchemas(): OperationSchemas {
  const { meta } = useApp<PluginOptions['appMeta']>()

  return meta.schemas
}

type UseSchemaNamespaceResult<TName extends string = string> = {
  name: TName
  types: {
    response: `${TName}.Response`
    request?: `${TName}.Request`
    pathParams?: `${TName}.PathParams`
    queryParams?: `${TName}.QueryParams`
    headerParams?: `${TName}.HeaderParams`
    errors?: `${TName}.Errors`
  }
}

export function useSchemaNamespace<TName extends string = string>(): UseSchemaNamespaceResult<TName> {
  const { meta } = useApp<PluginOptions['appMeta']>()
  const schemas = useSchemas()
  const operation = meta.operation

  const operationName = transformers.pascalCase(`${operation.getOperationId()}`)
  const name = operation.method === 'get' ? `${operationName}Query` as TName : `${operationName}Mutation` as TName

  return {
    name,
    types: {
      response: `${name}.Response`,
      request: schemas.request?.name ? `${name}.Request` : undefined,
      pathParams: schemas.pathParams?.name ? `${name}.PathParams` : undefined,
      queryParams: schemas.queryParams?.name ? `${name}.QueryParams` : undefined,
      headerParams: schemas.headerParams?.name ? `${name}.HeaderParams` : undefined,
      errors: schemas.errors?.length ? `${name}.Errors` : undefined,
    },
  }
}

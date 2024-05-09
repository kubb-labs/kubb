import transformers from '@kubb/core/transformers'

import type { ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { KubbFile } from '@kubb/core'
import type { OasTypes, Operation } from '@kubb/oas'
import type { OperationSchemas, OperationsByMethod } from '@kubb/plugin-oas'

const parameters = {
  getPathParams(name: string, item: NonNullable<OperationSchemas['pathParams']>): string[] {
    const parameters: string[] = []

    item.keys?.forEach((key) => {
      const schema = item.schema?.properties?.[key] as OasTypes.SchemaObject
      const shape = item.schema?.$ref ? `schema.shape['${key}']` : `shape['${key}']`
      const required = Array.isArray(item.schema.required) ? !!item.schema.required?.length : !!item.schema.required
      const definedSchema = required ? `${name}.${shape}` : `${name}.unwrap().${shape}`

      parameters.push(`
        {
          name: "${key}",
          description: \`${transformers.escape(schema?.description)}\`,
          type: "Path",
          schema: ${definedSchema}
        }
      `)
    })

    return parameters
  },
  getQueryParams(name: string, item: NonNullable<OperationSchemas['queryParams']>): string[] {
    const parameters: string[] = []

    item.keys?.forEach((key) => {
      const schema = item.schema?.properties?.[key] as OasTypes.SchemaObject
      const shape = item.schema?.$ref ? `schema.shape['${key}']` : `shape['${key}']`
      const required = Array.isArray(item.schema.required) ? !!item.schema.required?.length : !!item.schema.required
      const definedSchema = required ? `${name}.${shape}` : `${name}.unwrap().${shape}`

      parameters.push(`
      {
        name: "${key}",
        description: \`${transformers.escape(schema?.description)}\`,
        type: "Query",
        schema: ${definedSchema}
      }
    `)
    })
    return parameters
  },
  getHeaderParams(name: string, item: NonNullable<OperationSchemas['queryParams']>): string[] {
    const parameters: string[] = []

    item.keys?.forEach((key) => {
      const schema = item.schema?.properties?.[key] as OasTypes.SchemaObject
      const shape = item.schema?.$ref ? `schema.shape['${key}']` : `shape['${key}']`
      const required = Array.isArray(item.schema.required) ? !!item.schema.required?.length : !!item.schema.required
      const definedSchema = required ? `${name}.${shape}` : `${name}.unwrap().${shape}`

      parameters.push(`
      {
        name: "${key}",
        description: \`${transformers.escape(schema?.description)}\`,
        type: "Header",
        schema: ${definedSchema}
      }
    `)
    })
    return parameters
  },
  getRequest(name: string, item: NonNullable<OperationSchemas['request']>): string[] {
    const parameters: string[] = []

    parameters.push(`
    {
      name: "${item.name}",
      description: \`${transformers.escape(item.description)}\`,
      type: "Body",
      schema: ${name}
    }
  `)
    return parameters
  },
} as const

export function getDefinitionsImports(
  operationsByMethod: OperationsByMethod,
  {
    resolveName,
    resolvePath,
    pluginKey,
  }: {
    resolveName: (params: ResolveNameParams) => string
    resolvePath: (params: ResolvePathParams) => KubbFile.OptionalPath
    pluginKey: ResolveNameParams['pluginKey']
  },
): Array<{ name: string; path: KubbFile.OptionalPath }> {
  const definitions: Array<{ name: string; operation: Operation }> = []

  Object.keys(operationsByMethod).forEach((path) => {
    const operations = operationsByMethod[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation, schemas }) => {
      const responseName = resolveName({
        name: schemas.response.name,
        pluginKey,
        type: 'function',
      })

      definitions.push({ name: responseName, operation })

      if (schemas.pathParams?.name) {
        const name = resolveName({
          name: schemas.pathParams.name,
          pluginKey,
          type: 'function',
        })

        definitions.push({ name, operation })
      }

      if (schemas.queryParams?.name) {
        const name = resolveName({
          name: schemas.queryParams.name,
          pluginKey,
          type: 'function',
        })

        definitions.push({ name, operation })
      }

      if (schemas.headerParams?.name) {
        const name = resolveName({
          name: schemas.headerParams.name,
          pluginKey,
          type: 'function',
        })

        definitions.push({ name, operation })
      }

      if (schemas.request?.name) {
        const name = resolveName({
          name: schemas.request.name,
          pluginKey,
          type: 'function',
        })

        definitions.push({ name, operation })
      }
      if (schemas.errors) {
        schemas.errors.forEach((errorOperationSchema) => {
          if (!errorOperationSchema.statusCode) {
            return
          }

          const name = resolveName({
            name: `${operation.getOperationId()} ${errorOperationSchema.statusCode}`,
            pluginKey,
            type: 'function',
          })

          definitions.push({ name, operation })
        })
      }
    })
  })

  return definitions.map(({ name, operation }) => {
    const baseName = resolveName({
      name: `${operation.getOperationId()}`,
      pluginKey,
      type: 'file',
    })

    const path = resolvePath({
      pluginKey,
      baseName: `${baseName}.ts`,
      options: {
        tag: operation?.getTags()[0]?.name,
      },
    })
    return { name, path }
  })
}

export function getDefinitions(
  operationsByMethod: OperationsByMethod,
  {
    resolveName,
    pluginKey,
  }: {
    resolveName: (params: ResolveNameParams) => string
    pluginKey: ResolveNameParams['pluginKey']
  },
): Array<{
  operation: Operation
  response: string | undefined
  parameters: string[]
  errors: string[]
}> {
  const definitions: Array<{
    response: string
    operation: Operation
    parameters: string[]
    errors: string[]
  }> = []

  Object.keys(operationsByMethod).forEach((path) => {
    const operations = operationsByMethod[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation, schemas }) => {
      let params: string[] = []
      const errors: string[] = []
      const responseName = resolveName({
        name: schemas.response.name,
        pluginKey,
        type: 'function',
      })

      if (schemas.pathParams?.name) {
        const name = resolveName({
          name: schemas.pathParams.name,
          pluginKey,
          type: 'function',
        })
        params = [...params, ...parameters.getPathParams(name, schemas.pathParams)]
      }

      if (schemas.queryParams?.name) {
        const name = resolveName({
          name: schemas.queryParams.name,
          pluginKey,
          type: 'function',
        })
        params = [...params, ...parameters.getQueryParams(name, schemas.queryParams)]
      }

      if (schemas.headerParams?.name) {
        const name = resolveName({
          name: schemas.headerParams.name,
          pluginKey,
          type: 'function',
        })
        params = [...params, ...parameters.getHeaderParams(name, schemas.headerParams)]
      }

      if (schemas.request?.name) {
        const name = resolveName({
          name: schemas.request.name,
          pluginKey,
          type: 'function',
        })
        params = [...params, ...parameters.getRequest(name, schemas.request)]
      }
      if (schemas.errors) {
        schemas.errors.forEach((errorOperationSchema) => {
          if (!errorOperationSchema.statusCode) {
            return
          }

          const name = resolveName({
            name: `${operation.getOperationId()} ${errorOperationSchema.statusCode}`,
            pluginKey,
            type: 'function',
          })

          if (errorOperationSchema.statusCode) {
            errors.push(`
              {
                status: ${errorOperationSchema.statusCode},
                description: \`${transformers.escape(errorOperationSchema.description)}\`,
                schema: ${name}
              }
            `)
          }
        })
      }
      definitions.push({
        operation,
        parameters: params,
        errors,
        response: responseName,
      })
    })
  })

  return definitions
}

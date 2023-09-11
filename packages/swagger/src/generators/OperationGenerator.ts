/* eslint-disable @typescript-eslint/unbound-method */
import { combineFiles, Generator } from '@kubb/core'

import { pascalCase, pascalCaseTransformMerge } from 'change-case'

import { isReference } from '../utils/isReference.ts'

import type { File } from '@kubb/core'
import type { Operation } from 'oas'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types.ts'
import type { OpenAPIV3 } from 'openapi-types'
import type { ContentType, Oas, OperationSchemas, Resolver, SkipBy } from '../types.ts'
import { Warning } from '@kubb/core'

import { utils } from 'oas'

const { findSchemaDefinition } = utils

type Options = {
  oas: Oas
  skipBy?: SkipBy[]
  contentType?: ContentType
}

export abstract class OperationGenerator<TOptions extends Options = Options> extends Generator<TOptions> {
  /**
   *
   * Validate an operation to see if used with camelCase we don't overwrite other files
   * DRAFT version
   */
  validate(operation: Operation): void {
    const { oas } = this.options
    const schemas = oas.getDefinition().components?.schemas || {}

    const foundSchemaKey = Object.keys(schemas).find(
      (key) => key.toLowerCase() === pascalCase(operation.getOperationId(), { delimiter: '', transform: pascalCaseTransformMerge }).toLowerCase(),
    )

    if (foundSchemaKey) {
      throw new Warning(`OperationId '${operation.getOperationId()}' has the same name used as in schemas '${foundSchemaKey}' when using CamelCase`)
    }
  }

  isSkipped(operation: Operation, method: HttpMethod): boolean {
    const { skipBy = [] } = this.options
    let skip = false

    skipBy.forEach(({ pattern, type }) => {
      if (type === 'tag' && !skip) {
        skip = !!operation.getTags()[0]?.name.match(pattern)
      }

      if (type === 'operationId' && !skip) {
        skip = !!operation.getOperationId().match(pattern)
      }

      if (type === 'path' && !skip) {
        skip = !!operation.path.match(pattern)
      }

      if (type === 'method' && !skip) {
        skip = !!method.match(pattern)
      }
    })

    return skip
  }

  private getParametersSchema(operation: Operation, inKey: 'path' | 'query'): OpenAPIV3.SchemaObject | null {
    const contentType = this.options.contentType || operation.getContentType()
    const params = operation
      .getParameters()
      .map((item) => {
        const param = item as unknown as OpenAPIV3.ReferenceObject & OpenAPIV3.ParameterObject
        if (isReference(param)) {
          return findSchemaDefinition(param.$ref, operation.api) as OpenAPIV3.ParameterObject
        }

        return param
      })
      .filter((v) => v.in === inKey)

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          required: [...(schema.required || []), pathParameters.required ? pathParameters.name : undefined].filter(Boolean),
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.content?.[contentType]?.schema ?? (pathParameters.schema as OpenAPIV3.SchemaObject),
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OpenAPIV3.SchemaObject,
    )
  }

  private getResponseSchema(operation: Operation, statusCode: string | number): OpenAPIV3.SchemaObject {
    const schema = operation.schema.responses?.[statusCode] as OpenAPIV3.ReferenceObject
    const contentType = this.options.contentType || operation.getContentType()

    if (isReference(schema)) {
      const responseSchema = findSchemaDefinition(schema?.$ref, operation.api) as OpenAPIV3.ResponseObject

      return responseSchema.content?.[contentType]?.schema as OpenAPIV3.SchemaObject
    }

    return operation.getResponseAsJSONSchema(statusCode)?.at(0)?.schema as OpenAPIV3.SchemaObject
  }

  public getSchemas(operation: Operation): OperationSchemas {
    const contentType = this.options.contentType || operation.getContentType()
    const pathParamsSchema = this.getParametersSchema(operation, 'path')
    const queryParamsSchema = this.getParametersSchema(operation, 'query')
    const requestSchema = operation.hasRequestBody()
      ? ((operation.getRequestBody() as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject) ||
        ((operation.getRequestBody(contentType) as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject)
      : undefined
    const responseSchema = this.getResponseSchema(operation, '200')

    return {
      pathParams: pathParamsSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} PathParams`, { delimiter: '', transform: pascalCaseTransformMerge }),
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: pathParamsSchema,
          }
        : undefined,
      queryParams: queryParamsSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} QueryParams`, { delimiter: '', transform: pascalCaseTransformMerge }),
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: queryParamsSchema,
          }
        : undefined,
      request: requestSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryRequest' : 'mutationRequest'}`, {
              delimiter: '',
              transform: pascalCaseTransformMerge,
            }),
            description: (operation.schema.requestBody as RequestBodyObject)?.description,
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: requestSchema,
          }
        : undefined,
      response: {
        name: pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`, {
          delimiter: '',
          transform: pascalCaseTransformMerge,
        }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
        schema: responseSchema,
        statusCode: 200,
      },
      errors: operation
        .getResponseStatusCodes()
        .filter((statusCode) => statusCode !== '200')
        .map((statusCode) => {
          let name = statusCode
          if (name === 'default') {
            name = 'error'
          }

          return {
            name: pascalCase(`${operation.getOperationId()} ${name}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            description:
              operation.getResponseAsJSONSchema(statusCode)?.at(0)?.description ||
              (operation.getResponseByStatusCode(statusCode) as OpenAPIV3.ResponseObject)?.description,
            schema: this.getResponseSchema(operation, statusCode),
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            statusCode: name === 'error' ? undefined : Number(statusCode),
          }
        }),
    }
  }

  private get methods() {
    return {
      get: this.get,
      post: this.post,
      patch: this.patch,
      put: this.put,
      delete: this.delete,
      head: () => {
        return null
      },
      options: () => {
        return null
      },
      trace: () => {
        return null
      },
    } as const
  }

  async build(): Promise<File[]> {
    const { oas } = this.options
    const paths = oas.getPaths()
    const filterdPaths = Object.keys(paths).reduce(
      (acc, path) => {
        const methods = Object.keys(paths[path]) as HttpMethod[]

        methods.forEach((method) => {
          const operation = oas.operation(path, method)
          if (operation && this.methods[method]) {
            const isSkipped = this.isSkipped(operation, method)

            if (!isSkipped) {
              if (!acc.path) {
                acc.path = {} as typeof acc.path
              }
              acc[path] = {
                ...acc[path],
                [method]: paths[path][method],
              }
            }
          }
        })

        return acc
      },
      {} as typeof paths,
    )

    const promises = Object.keys(filterdPaths).reduce(
      (acc, path) => {
        const methods = Object.keys(filterdPaths[path]) as HttpMethod[]

        methods.forEach((method) => {
          const operation = oas.operation(path, method)
          const promise = this.methods[method].call(this, operation, this.getSchemas(operation))
          if (promise) {
            acc.push(promise)
          }
        })

        return acc
      },
      [] as Promise<File | null>[],
    )

    promises.push(this.all(filterdPaths))

    const files = await Promise.all(promises)

    return combineFiles(files)
  }

  /**
   * GET
   */
  abstract get(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * POST
   */
  abstract post(operation: Operation, schemas: OperationSchemas): Promise<File | null>
  /**
   * PATCH
   */
  abstract patch(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * PUT
   */
  abstract put(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * DELETE
   */
  abstract delete(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * Combination of GET, POST, PATCH, PUT, DELETE
   */
  abstract all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null>

  /**
   * Call resolveType and get back the name, filePath and fileName
   */
  abstract resolve(operation: Operation): Resolver
}

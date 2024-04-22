import BaseOas from 'oas'
import OASNormalize from 'oas-normalize'
import type { Operation } from 'oas/operation'
import type { MediaTypeObject, OASDocument, ResponseObject, SchemaObject, User } from 'oas/types'
import { findSchemaDefinition, matchesMimeType } from 'oas/utils'
import type { MediaType } from './types.ts'
import { isReference } from './utils.ts'
type Options = {
  mediaType?: MediaType
}

export class Oas<const TOAS = unknown> extends BaseOas {
  #options: Options = {}
  document: TOAS = undefined as unknown as TOAS

  constructor({ oas, user }: { oas: TOAS | OASDocument | string; user?: User }, options: Options = {}) {
    if (typeof oas === 'string') {
      oas = JSON.parse(oas)
    }

    super(oas as OASDocument, user)

    this.document = oas as TOAS
    this.#options = options
  }

  dereference(schema?: unknown, { withRef = false }: { withRef?: boolean } = {}) {
    if (isReference(schema)) {
      if (withRef) {
        return {
          ...findSchemaDefinition(schema?.$ref, this.api),
          $ref: schema.$ref,
        }
      }
      return findSchemaDefinition(schema?.$ref, this.api)
    }

    return schema
  }

  /**
   * Oas does not have a getResponseBody(mediaType)
   */
  #getResponseBodyFactory(responseBody: boolean | ResponseObject): (mediaType?: string) => MediaTypeObject | false | [string, MediaTypeObject, ...string[]] {
    function hasResponseBody(res = responseBody): res is ResponseObject {
      return !!res
    }

    return (mediaType) => {
      if (!hasResponseBody(responseBody)) {
        return false
      }

      if (isReference(responseBody)) {
        // If the request body is still a `$ref` pointer we should return false because this library
        // assumes that you've run dereferencing beforehand.
        return false
      }

      if (!responseBody.content) {
        return false
      }

      if (mediaType) {
        if (!(mediaType in responseBody.content)) {
          return false
        }

        return responseBody.content[mediaType]!
      }

      // Since no media type was supplied we need to find either the first JSON-like media type that
      // we've got, or the first available of anything else if no JSON-like media types are present.
      let availableMediaType: string | undefined = undefined
      const mediaTypes = Object.keys(responseBody.content)
      mediaTypes.forEach((mt: string) => {
        if (!availableMediaType && matchesMimeType.json(mt)) {
          availableMediaType = mt
        }
      })

      if (!availableMediaType) {
        mediaTypes.forEach((mt: string) => {
          if (!availableMediaType) {
            availableMediaType = mt
          }
        })
      }

      if (availableMediaType) {
        return [availableMediaType, responseBody.content[availableMediaType]!, ...(responseBody.description ? [responseBody.description] : [])]
      }

      return false
    }
  }

  getResponseSchema(operation: Operation, statusCode: string | number): SchemaObject {
    if (operation.schema.responses) {
      Object.keys(operation.schema.responses).forEach((key) => {
        operation.schema.responses![key] = this.dereference(operation.schema.responses![key])
      })
    }

    const getResponseBody = this.#getResponseBodyFactory(operation.getResponseByStatusCode(statusCode))

    const { mediaType } = this.#options
    const responseBody = getResponseBody(mediaType)

    if (responseBody === false) {
      // return empty object because response will always be defined(request does not need a body)
      return {}
    }

    const schema = Array.isArray(responseBody) ? responseBody[1].schema : responseBody.schema

    if (!schema) {
      // return empty object because response will always be defined(request does not need a body)

      return {}
    }

    return this.dereference(schema, { withRef: true })
  }

  getRequestSchema(operation: Operation): SchemaObject | undefined {
    const { mediaType } = this.#options

    if (operation.schema.requestBody) {
      operation.schema.requestBody = this.dereference(operation.schema.requestBody)
    }

    const requestBody = operation.getRequestBody(mediaType)

    if (requestBody === false) {
      return undefined
    }

    const schema = Array.isArray(requestBody) ? requestBody[1].schema : requestBody.schema

    if (!schema) {
      return undefined
    }

    return this.dereference(schema, { withRef: true })
  }

  getParametersSchema(operation: Operation, inKey: 'path' | 'query' | 'header'): SchemaObject | null {
    const { mediaType = operation.getContentType() } = this.#options
    const params = operation
      .getParameters()
      .map((schema) => {
        return this.dereference(schema, { withRef: true })
      })
      .filter((v) => v.in === inKey)

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        const property = pathParameters.content?.[mediaType]?.schema ?? (pathParameters.schema as SchemaObject)
        const required = [...(schema.required || ([] as any)), pathParameters.required ? pathParameters.name : undefined].filter(Boolean)

        return {
          ...schema,
          description: schema.description,
          deprecated: schema.deprecated,
          example: schema.example,
          required,
          properties: {
            ...schema.properties,
            [pathParameters.name]: {
              description: pathParameters.description,
              ...property,
            },
          },
        }
      },
      { type: 'object', required: [], properties: {} } as SchemaObject,
    )
  }

  async valdiate() {
    const oasNormalize = new OASNormalize(this.api, {
      enablePaths: true,
      colorizeErrors: true,
    })

    await oasNormalize.validate()
  }
}

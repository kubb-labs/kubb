import pathParser from 'path'

import { camelCase, capitalCase } from 'change-case'

import type { PluginContext, File } from '@kubb/core'
import { Generator, getRelativePath } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger-typescript'
import { createJSDocBlockText, TypeBuilder } from '@kubb/swagger-typescript'

import { pluginName } from '../plugin'

import type { Operation } from 'oas'
import type { MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

type Options = {
  oas: Oas
  context: PluginContext
  fileResolverFactory?: (hookId: string, typePluginName?: string) => FileResolver
  typePluginName?: string
}

export class OperationGenerator extends Generator<Options> {
  async build() {
    const { oas } = this.options
    const paths = oas.getPaths()
    const promises: Promise<File | null>[] = []

    Object.keys(paths).forEach((path) => {
      promises.push(this.getGet(path))
      promises.push(this.getPost(path))
    })

    await Promise.all(promises)
  }

  private getSchemas(operation: Operation) {
    // TODO create function to get schema out of paramaters
    const schemaOperationPathParameters = operation.getParameters().filter((v) => v.in === 'path' || v.in === 'query')
    const schemaOperationPathParametersSchema = schemaOperationPathParameters.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', properties: {} } as OpenAPIV3.SchemaObject
    )

    const data = {
      params: {
        name: capitalCase(`${operation.getOperationId()} "Params"`, { delimiter: '' }),
        schema: schemaOperationPathParametersSchema,
      },
      request: {
        name: capitalCase(`${operation.getOperationId()} "Request"`, { delimiter: '' }),
        description: (operation.schema.requestBody as RequestBodyObject)?.description,
        schema: (operation.getRequestBody('application/json') as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject,
      },
      response: {
        name: capitalCase(`${operation.getOperationId()} "Response"`, { delimiter: '' }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        schema: operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject,
      },
    } as const
    return data
  }

  private getComments(operation: Operation) {
    return [
      operation.getDescription() && `@description ${operation.getDescription()}`,
      operation.getSummary() && `@summary ${operation.getSummary()}`,
      operation.path && `@link ${operation.path}`,
    ].filter(Boolean)
  }

  async getGet(path: string) {
    const { resolveId, addFile, config } = this.options.context
    const { oas, fileResolverFactory, typePluginName } = this.options
    const directory = pathParser.resolve(config.root, config.output.path)
    const operation = oas.operation(path, 'get')

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({
      fileName: hookId,
      directory,
      pluginName,
    })

    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: typePluginName, options: { type: 'model' } })

    const typeSource = await new TypeBuilder(oas)
      .add(schemas.params)
      .add(schemas.response)
      .addImports(fileResolverFactory?.(hookId, typePluginName))
      .addJSDocs()
      .print()

    if (typeFilePath) {
      await addFile({
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
       
      })
    }

    // end type creation

    // hook creation

    const comments = this.getComments(operation)

    const source = `
         ${createJSDocBlockText({ comments })}
          export const ${camelCase(`use ${operation.getOperationId()}`)} = (params: ${schemas.params.name}) => {
            return useQuery<${schemas.response.name}>({
              queryKey: ["${hookName}"],
              queryFn: () => {
                const template = parseTemplate("${operation.path}").expand(params)
                return axios
                  .get(template)
                  .then((res) => res.data)
              }
            })
          };
      `
   
     
    return addFile({
      path: hookFilePath,
      fileName: hookId,
      source,
      imports:[
        {
          name: ["useQuery"],
          path: "@tanstack/react-query"
        },
        {
          name: 'axios',
          path: "axios"
        },
        {
          name: ["parseTemplate"],
          path: "url-template"
        },
        {
          name: [schemas.response.name,schemas.params.name],
          path: getRelativePath(hookFilePath, typeFilePath),
          type: true
        }
      ]
    })
  }

  async getPost(path: string) {
    const { resolveId, addFile, config } = this.options.context
    const { oas, fileResolverFactory, typePluginName } = this.options
    const directory = pathParser.resolve(config.root, config.output.path)
    const operation = oas.operation(path, 'post')

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: typePluginName, options: { type: 'model' } })
    const typeSource = await new TypeBuilder(oas)
      .add(schemas.request)
      .add(schemas.response)
      .addImports(fileResolverFactory?.(hookId, typePluginName))
      .addJSDocs()
      .print()

    if (typeFilePath) {
      await addFile({
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
      })
    }

    // end type creation

    // hook creation

    const comments = this.getComments(operation)

    const source = `
        ${createJSDocBlockText({ comments })}
        export const ${camelCase(`use ${operation.getOperationId()}`)} = () => {
          return useMutation<${schemas.response.name}, unknown, ${schemas.request.name}>({
            mutationFn: (data) => {
              return axios
              .post("${operation.path}", data)
              .then((res) => res.data)
            }
          })
        };
    `

    return addFile({
      path: hookFilePath,
      fileName: hookId,
      source,
      imports:[
        {
          name: ["useMutation"],
          path: "@tanstack/react-query"
        },
        {
          name: 'axios',
          path: "axios"
        },
        {
          name: [schemas.request.name,schemas.response.name],
          path: getRelativePath(hookFilePath, typeFilePath),
          type: true
        }
      ]
    })

    // end hook creation
  }
}

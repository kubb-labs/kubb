import transformers from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'
import { File, useFile, usePlugin } from '@kubb/react'
import { usePluginManager } from '@kubb/react'
import { pluginKey as swaggerZodPluginKey } from '@kubb/swagger-zod'

import type { ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { KubbFile } from '@kubb/core'
import type { OperationSchemas, Paths } from '@kubb/swagger'
import type { OasTypes, Operation } from '@kubb/swagger/oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  definitions: string[]
  baseURL: string | undefined
}

function Template({
  name,
  definitions,
  baseURL,
}: TemplateProps): ReactNode {
  return (
    <>
      {`export const endpoints = makeApi([${definitions.join(',')}])`}
      {`export const getAPI = (baseUrl: string) => new Zodios(baseUrl, endpoints)`}
      {baseURL && `export const ${name} = new Zodios('${baseURL}', endpoints)`}
      {!baseURL && `export const  ${name} = new Zodios(endpoints)`}
      {`export default ${name}`}
    </>
  )
}
const defaultTemplates = { default: Template } as const

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

function getDefinitionsImports(
  paths: Paths,
  { resolveName, resolvePath, pluginKey }: {
    resolveName: (params: ResolveNameParams) => string
    resolvePath: (params: ResolvePathParams) => KubbFile.OptionalPath
    pluginKey: ResolveNameParams['pluginKey']
  },
): Array<{ name: string; path: KubbFile.OptionalPath }> {
  const definitions: Array<{ name: string; operation: Operation }> = []

  Object.keys(paths).forEach((path) => {
    const operations = paths[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation, schemas }) => {
      const responseName = resolveName({ name: schemas.response.name, pluginKey, type: 'function' })

      definitions.push({ name: responseName, operation })

      if (schemas.pathParams?.name) {
        const name = resolveName({ name: schemas.pathParams.name, pluginKey, type: 'function' })

        definitions.push({ name, operation })
      }

      if (schemas.queryParams?.name) {
        const name = resolveName({ name: schemas.queryParams.name, pluginKey, type: 'function' })

        definitions.push({ name, operation })
      }

      if (schemas.headerParams?.name) {
        const name = resolveName({ name: schemas.headerParams.name, pluginKey, type: 'function' })

        definitions.push({ name, operation })
      }

      if (schemas.request?.name) {
        const name = resolveName({ name: schemas.request.name, pluginKey, type: 'function' })

        definitions.push({ name, operation })
      }
      if (schemas.errors) {
        schemas.errors.forEach(
          (errorOperationSchema) => {
            if (!errorOperationSchema.statusCode) {
              return
            }

            const name = resolveName({ name: `${operation.getOperationId()} ${errorOperationSchema.statusCode}`, pluginKey, type: 'function' })

            definitions.push({ name, operation })
          },
        )
      }
    })
  })

  return definitions.map(({ name, operation }) => {
    const baseName = resolveName({ name: `${operation.getOperationId()}`, pluginKey, type: 'file' })

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

function getDefinitions(
  paths: Paths,
  { resolveName, pluginKey }: { resolveName: (params: ResolveNameParams) => string; pluginKey: ResolveNameParams['pluginKey'] },
): Array<{ operation: Operation; response: string | undefined; parameters: string[]; errors: string[] }> {
  const definitions: Array<{ response: string; operation: Operation; parameters: string[]; errors: string[] }> = []

  Object.keys(paths).forEach((path) => {
    const operations = paths[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation, schemas }) => {
      let params: string[] = []
      const errors: string[] = []
      const responseName = resolveName({ name: schemas.response.name, pluginKey, type: 'function' })

      // definitions.push({ name: responseName, response: responseName, operation, parameters: [], errors: [] })

      if (schemas.pathParams?.name) {
        const name = resolveName({ name: schemas.pathParams.name, pluginKey, type: 'function' })
        params = [...params, ...parameters.getPathParams(name, schemas.pathParams)]
        // definitions.push({ name, response: undefined, operation, parameters: parameters.getPathParams(name, schemas.pathParams), errors: [] })
      }

      if (schemas.queryParams?.name) {
        const name = resolveName({ name: schemas.queryParams.name, pluginKey, type: 'function' })
        params = [...params, ...parameters.getQueryParams(name, schemas.queryParams)]
        // definitions.push({ name, operation, parameters: parameters.getQueryParams(name, schemas.queryParams), errors: [] })
      }

      if (schemas.headerParams?.name) {
        const name = resolveName({ name: schemas.headerParams.name, pluginKey, type: 'function' })
        params = [...params, ...parameters.getHeaderParams(name, schemas.headerParams)]
        // definitions.push({ name, operation, parameters: parameters.getHeaderParams(name, schemas.headerParams), errors: [] })
      }

      if (schemas.request?.name) {
        const name = resolveName({ name: schemas.request.name, pluginKey, type: 'function' })
        params = [...params, ...parameters.getRequest(name, schemas.request)]
        // definitions.push({ name, operation, parameters: parameters.getRequest(name, schemas.request), errors: [] })
      }
      if (schemas.errors) {
        schemas.errors.forEach(
          (errorOperationSchema) => {
            if (!errorOperationSchema.statusCode) {
              return
            }

            const name = resolveName({ name: `${operation.getOperationId()} ${errorOperationSchema.statusCode}`, pluginKey, type: 'function' })

            if (errorOperationSchema.statusCode) {
              errors.push(`
              {
                status: ${errorOperationSchema.statusCode},
                description: \`${transformers.escape(errorOperationSchema.description)}\`,
                schema: ${name}
              }
            `)
            }
          },
        )
      }
      definitions.push({ operation, parameters: params, errors, response: responseName })
    })
  })

  return definitions
}

type Props = {
  baseURL: string | undefined
  paths: Paths
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Definitions({
  baseURL,
  paths,
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const pluginManager = usePluginManager()
  const definitions = getDefinitions(paths, { resolveName: pluginManager.resolveName, pluginKey: swaggerZodPluginKey })

  return (
    <Template
      name={'api'}
      baseURL={baseURL}
      definitions={definitions.map(({ errors, response, operation, parameters }) => {
        return `
        {
          method: "${operation.method}",
          path: "${new URLPath(operation.path).URL}",
          description: \`${transformers.escape(operation.getDescription())}\`,
          requestFormat: "json",
          parameters: [
              ${parameters.join(',')}
          ],
          response: ${response},
          errors: [
              ${errors.join(',')}
          ],
      }
      `
      })}
    />
  )
}

type FileProps = {
  name: string
  baseURL: string | undefined
  paths: Paths
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Definitions.File = function({ name, baseURL, paths, templates = defaultTemplates }: FileProps): ReactNode {
  const pluginManager = usePluginManager()
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name, extName: '.ts', pluginKey })

  const definitionsImports = getDefinitionsImports(paths, {
    resolveName: pluginManager.resolveName,
    resolvePath: pluginManager.resolvePath,
    pluginKey: swaggerZodPluginKey,
  })

  const imports = definitionsImports.map(({ name, path }, index) => {
    if (!path) {
      return null
    }

    return <File.Import key={index} name={[name]} root={file.path} path={path} />
  }).filter(Boolean)

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      <File.Import name={['makeApi', 'Zodios']} path="@zodios/core" />
      {imports}
      <File.Source>
        <Definitions Template={Template} paths={paths} baseURL={baseURL} />
      </File.Source>
    </File>
  )
}

Definitions.templates = defaultTemplates

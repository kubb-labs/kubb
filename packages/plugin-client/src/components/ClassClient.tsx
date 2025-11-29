import path from 'node:path'
import React from 'react'
import { URLPath } from '@kubb/core/utils'
import { isOptional, type Operation } from '@kubb/oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginClient } from '../types'

type Props = {
  name: string
  operations: Array<Operation>
  plugin: PluginClient
  config: any
  generator: any
}

export function ClassClient({ name, operations, plugin, config, generator }: Props): KubbNode {
  const { options } = plugin
  const { getFile, getSchemas } = useOperationManager(generator)

  // Collect all imports needed
  const imports = new Set<string>()
  const typeImports = new Set<string>()

  operations.forEach((operation) => {
    const typeSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
    const zodSchemas = options.parser === 'zod' ? getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }) : undefined

    if (typeSchemas.request?.name) typeImports.add(typeSchemas.request.name)
    if (typeSchemas.response?.name) typeImports.add(typeSchemas.response.name)
    if (typeSchemas.pathParams?.name) typeImports.add(typeSchemas.pathParams.name)
    if (typeSchemas.queryParams?.name) typeImports.add(typeSchemas.queryParams.name)
    if (typeSchemas.headerParams?.name) typeImports.add(typeSchemas.headerParams.name)
    typeSchemas.errors?.forEach((item) => typeImports.add(item.name))

    if (zodSchemas?.request?.name) imports.add(zodSchemas.request.name)
    if (zodSchemas?.response?.name) imports.add(zodSchemas.response.name)
  })

  const firstOperation = operations[0]
  const typeFile = getFile(firstOperation, { pluginKey: [pluginTsName] })
  const zodFile = options.parser === 'zod' ? getFile(firstOperation, { pluginKey: [pluginZodName] }) : undefined

  return (
    <>
      {/* Imports */}
      {options.importPath ? (
        <>
          <File.Import name={'fetch'} path={options.importPath} />
          <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.importPath} isTypeOnly />
        </>
      ) : (
        <>
          <File.Import name={['fetch']} root={config.root} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
          <File.Import
            name={['RequestConfig', 'ResponseErrorConfig']}
            root={config.root}
            path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
            isTypeOnly
          />
        </>
      )}

      <File.Import name={['buildFormData']} root={config.root} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />

      {zodFile && imports.size > 0 && <File.Import name={Array.from(imports)} root={config.root} path={zodFile.path} />}

      {typeImports.size > 0 && <File.Import name={Array.from(typeImports)} root={config.root} path={typeFile.path} isTypeOnly />}

      {/* Class definition */}
      <File.Source name={name} isExportable isIndexable>
        {`/**
 * ${name}
 * @class
 */
export class ${name} {
  private client: typeof fetch
  private baseConfig: Partial<RequestConfig>

  constructor(config: Partial<RequestConfig> = {}) {
    this.client = config.client || fetch
    this.baseConfig = config
  }
`}

        {operations.map((operation) => {
          const { getName } = useOperationManager(generator)
          const methodName = getName(operation, { type: 'function' })
          const typeSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
          const zodSchemas = options.parser === 'zod' ? getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }) : undefined

          const urlPath = new URLPath(operation.path, { casing: options.paramsCasing })
          const contentType = operation.getContentType()
          const isFormData = contentType === 'multipart/form-data'

          const headers = [
            contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
            typeSchemas.headerParams?.name ? '...headers' : undefined,
          ].filter(Boolean)

          const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
          const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)

          // Build params for the method
          const params =
            options.paramsType === 'object'
              ? FunctionParams.factory({
                  data: {
                    mode: 'object',
                    children: {
                      ...getPathParams(typeSchemas.pathParams, { typed: true, casing: options.paramsCasing }),
                      data: typeSchemas.request?.name
                        ? {
                            type: typeSchemas.request?.name,
                            optional: isOptional(typeSchemas.request?.schema),
                          }
                        : undefined,
                      params: typeSchemas.queryParams?.name
                        ? {
                            type: typeSchemas.queryParams?.name,
                            optional: isOptional(typeSchemas.queryParams?.schema),
                          }
                        : undefined,
                      headers: typeSchemas.headerParams?.name
                        ? {
                            type: typeSchemas.headerParams?.name,
                            optional: isOptional(typeSchemas.headerParams?.schema),
                          }
                        : undefined,
                    },
                  },
                  config: {
                    type: typeSchemas.request?.name
                      ? `Partial<RequestConfig<${typeSchemas.request?.name}>>`
                      : 'Partial<RequestConfig>',
                    default: '{}',
                  },
                })
              : FunctionParams.factory({
                  pathParams: typeSchemas.pathParams?.name
                    ? {
                        mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
                        children: getPathParams(typeSchemas.pathParams, { typed: true, casing: options.paramsCasing }),
                        optional: isOptional(typeSchemas.pathParams?.schema),
                      }
                    : undefined,
                  data: typeSchemas.request?.name
                    ? {
                        type: typeSchemas.request?.name,
                        optional: isOptional(typeSchemas.request?.schema),
                      }
                    : undefined,
                  params: typeSchemas.queryParams?.name
                    ? {
                        type: typeSchemas.queryParams?.name,
                        optional: isOptional(typeSchemas.queryParams?.schema),
                      }
                    : undefined,
                  headers: typeSchemas.headerParams?.name
                    ? {
                        type: typeSchemas.headerParams?.name,
                        optional: isOptional(typeSchemas.headerParams?.schema),
                      }
                    : undefined,
                  config: {
                    type: typeSchemas.request?.name
                      ? `Partial<RequestConfig<${typeSchemas.request?.name}>>`
                      : 'Partial<RequestConfig>',
                    default: '{}',
                  },
                })

          const comments = getComments(operation)
          const jsdoc = comments.length > 0 ? `\n  /**\n${comments.map((comment) => `   * ${comment}`).join('\n')}\n   */` : ''

          return (
            <React.Fragment key={operation.getOperationId()}>
              {jsdoc}
              {`
  async ${methodName}(${params.toConstructor()}): Promise<${typeSchemas.response.name}> {
    const mergedConfig = this.mergeConfig(config)
    
`}
              {options.parser === 'zod' && zodSchemas?.request?.name && `    const requestData = ${zodSchemas.request.name}.parse(data)\n`}
              {options.parser === 'client' && typeSchemas?.request?.name && '    const requestData = data\n'}
              {isFormData && '    const formData = buildFormData(requestData)\n'}
              {`
    const res = await this.client<${generics.join(', ')}>({
      method: '${operation.method.toUpperCase()}',
      url: ${urlPath.template},`}
              {options.baseURL && `\n      baseURL: '${options.baseURL}',`}
              {typeSchemas.queryParams?.name && '\n      params,'}
              {typeSchemas.request?.name && `\n      data: ${isFormData ? 'formData as FormData' : 'requestData'},`}
              {headers.length > 0 && `\n      headers: { ${headers.join(', ')} },`}
              {`
      ...mergedConfig,
    })
    
`}
              {options.dataReturnType === 'full' && options.parser === 'zod' && zodSchemas && `    return { ...res, data: ${zodSchemas.response.name}.parse(res.data) }\n`}
              {options.dataReturnType === 'data' && options.parser === 'zod' && zodSchemas && `    return ${zodSchemas.response.name}.parse(res.data)\n`}
              {options.dataReturnType === 'full' && options.parser === 'client' && '    return res\n'}
              {options.dataReturnType === 'data' && options.parser === 'client' && '    return res.data\n'}
              {'  }\n'}
            </React.Fragment>
          )
        })}

        {`
  /**
   * Merge base config with method-specific config
   * @private
   */
  private mergeConfig(config: Partial<RequestConfig>): Partial<RequestConfig> {
    return {
      ...this.baseConfig,
      ...config,
      headers: {
        ...this.baseConfig.headers,
        ...config.headers,
      },
    }
  }
}
`}
      </File.Source>
    </>
  )
}

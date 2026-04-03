import path from 'node:path'
import { caseParams, transform } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { Client } from '../components/Client'
import { Url } from '../components/Url.tsx'
import type { PluginClient } from '../types'

export const clientGenerator = defineGenerator<PluginClient>({
  name: 'client',
  operation(node, options) {
    const { adapter, config, driver, resolver, plugin, root } = this
    const { output, urlType, dataReturnType, paramsCasing, paramsType, pathParamsType, parser, importPath, group } = options
    const baseURL = options.baseURL ?? adapter.rootNode?.meta?.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs?.resolver) {
      return null
    }

    const tsResolver = pluginTs.resolver

    const pluginZod = parser === 'zod' ? driver.getPlugin(pluginZodName) : undefined
    const zodResolver = pluginZod?.resolver

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    const casedParams = caseParams(transformedNode.parameters, paramsCasing)
    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...pathParams.map((p) => tsResolver.resolvePathParamsName(transformedNode, p)),
      ...queryParams.map((p) => tsResolver.resolveQueryParamsName(transformedNode, p)),
      ...headerParams.map((p) => tsResolver.resolveHeaderParamsName(transformedNode, p)),
      transformedNode.requestBody?.schema ? tsResolver.resolveDataName(transformedNode) : undefined,
      tsResolver.resolveResponseName(transformedNode),
      ...transformedNode.responses.map((res) => tsResolver.resolveResponseStatusName(transformedNode, res.statusCode)),
    ].filter(Boolean)

    const importedZodNames =
      zodResolver && parser === 'zod'
        ? [
            zodResolver.resolveResponseName?.(transformedNode),
            transformedNode.requestBody?.schema ? zodResolver.resolveDataName?.(transformedNode) : undefined,
          ].filter(Boolean)
        : []

    const meta = {
      name: resolver.resolveName(transformedNode.operationId),
      urlName: `get${resolver.resolveName(transformedNode.operationId).charAt(0).toUpperCase()}${resolver.resolveName(transformedNode.operationId).slice(1)}Url`,
      file: resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      ),
      fileTs: tsResolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group,
        },
      ),
      fileZod:
        zodResolver && pluginZod?.options
          ? zodResolver.resolveFile(
              { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
              {
                root,
                output: pluginZod.options.output ?? output,
                group: pluginZod.options.group,
              },
            )
          : undefined,
    } as const

    const isFormData = transformedNode.requestBody?.contentType === 'multipart/form-data'

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {importPath ? (
          <>
            <File.Import name={'fetch'} path={importPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
          </>
        ) : (
          <>
            <File.Import name={['fetch']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
          </>
        )}

        {isFormData && transformedNode.requestBody?.schema && (
          <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
        )}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames as string[]} root={meta.file.path} path={meta.fileZod.path} />}

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <Url
          name={meta.urlName}
          baseURL={baseURL}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          node={transformedNode}
          tsResolver={tsResolver}
          isIndexable={urlType === 'export'}
          isExportable={urlType === 'export'}
        />

        <Client
          name={meta.name}
          urlName={meta.urlName}
          baseURL={baseURL}
          dataReturnType={dataReturnType}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          node={transformedNode}
          tsResolver={tsResolver}
          zodResolver={zodResolver}
          parser={parser}
        />
      </File>
    )
  },
})

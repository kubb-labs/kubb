import path from 'node:path'
import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/renderer-jsx'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientStaticGenerator = defineGenerator<PluginClient>({
  name: 'client',
  operation(node, options) {
    const { config, plugin, driver, resolver, adapter } = this
    const { output, importPath, dataReturnType, pathParamsType, paramsType, paramsCasing, parser } = options
    const baseURL = adapter.inputNode?.meta?.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs?.resolver) return null

    const tsResolver = pluginTs.resolver
    const root = path.resolve(config.root, config.output.path)

    const transformedNode = plugin.transformer ? node : node
    const name = resolver.resolveName(transformedNode.operationId)

    const clientFile = resolver.resolveFile(
      { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
      { root, output, group: options.group },
    )

    const typeFile = tsResolver.resolveFile(
      { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
      { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
    )

    const requestName = transformedNode.requestBody?.schema ? tsResolver.resolveDataName(transformedNode) : undefined
    const responseName = tsResolver.resolveResponseName(transformedNode)
    const pathParamsName =
      transformedNode.parameters.filter((p) => p.in === 'path').length > 0
        ? tsResolver.resolvePathParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'path')[0]!)
        : undefined
    const queryParamsName =
      transformedNode.parameters.filter((p) => p.in === 'query').length > 0
        ? tsResolver.resolveQueryParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'query')[0]!)
        : undefined
    const headerParamsName =
      transformedNode.parameters.filter((p) => p.in === 'header').length > 0
        ? tsResolver.resolveHeaderParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'header')[0]!)
        : undefined

    const errorTypeNames = transformedNode.responses
      .filter((r) => {
        const code = Number.parseInt(r.statusCode, 10)
        return code >= 400 || r.statusCode === 'default'
      })
      .map((r) => tsResolver.resolveResponseStatusName(transformedNode, r.statusCode))
      .filter(Boolean) as string[]

    const typeImportNames = [requestName, responseName, pathParamsName, queryParamsName, headerParamsName, ...errorTypeNames].filter(Boolean) as string[]

    const banner = resolver.resolveBanner(null, { output, config })
    const footer = resolver.resolveFooter(null, { output, config })

    return (
      <File baseName={clientFile.baseName} path={clientFile.path} meta={clientFile.meta} banner={banner} footer={footer}>
        {importPath ? (
          <>
            <File.Import name={'fetch'} path={importPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
          </>
        ) : (
          <>
            <File.Import name={'fetch'} root={clientFile.path} path={path.resolve(config.root, config.output.path, '.kubb/fetcher.ts')} />
            <File.Import
              name={['RequestConfig', 'ResponseErrorConfig']}
              root={clientFile.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetcher.ts')}
              isTypeOnly
            />
          </>
        )}

        <File.Import name={typeImportNames} root={clientFile.path} path={typeFile.path} isTypeOnly />

        <Client
          name={name}
          baseURL={baseURL}
          dataReturnType={dataReturnType}
          pathParamsType={pathParamsType}
          paramsType={paramsType}
          paramsCasing={paramsCasing}
          node={transformedNode}
          tsResolver={tsResolver}
          parser={parser}
          zodResolver={undefined}
        />
        <File.Source>
          {`${name}.method = "${transformedNode.method}" as const
${name}.url = "${toURL(transformedNode.path)}" as const
${name}.operationId = "${name}" as const
${name}.request = {} as ${requestName || 'never'}
${name}.response = {} as ${responseName || 'never'}
${name}.pathParams = {} as ${pathParamsName || 'never'}
${name}.queryParams = {} as ${queryParamsName || 'never'}`}
        </File.Source>
      </File>
    )
  },
})

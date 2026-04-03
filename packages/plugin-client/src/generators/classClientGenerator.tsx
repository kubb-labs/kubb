import path from 'node:path'
import { camelCase, pascalCase } from '@internals/utils'
import { transform } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import type { FabricFile } from '@kubb/fabric-core/types'
import type { PluginTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { ClassClient } from '../components/ClassClient'
import { WrapperClient } from '../components/WrapperClient'
import type { PluginClient } from '../types'

type OperationData = {
  node: OperationNode
  name: string
  tsResolver: PluginTs['resolver']
  zodResolver: PluginZod['resolver'] | undefined
  typeFile: FabricFile.File
  zodFile: FabricFile.File | undefined
}

type Controller = {
  name: string
  file: FabricFile.File
  operations: Array<OperationData>
}

function resolveTypeImportNames(node: OperationNode, tsResolver: PluginTs['resolver']): Array<string> {
  const names: Array<string | undefined> = [
    node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
    tsResolver.resolveResponseName(node),
    ...node.parameters.filter((p) => p.in === 'path').map((p) => tsResolver.resolvePathParamsName(node, p)),
    ...node.parameters.filter((p) => p.in === 'query').map((p) => tsResolver.resolveQueryParamsName(node, p)),
    ...node.parameters.filter((p) => p.in === 'header').map((p) => tsResolver.resolveHeaderParamsName(node, p)),
    ...node.responses.map((res) => tsResolver.resolveResponseStatusName(node, res.statusCode)),
  ]
  return names.filter((n): n is string => Boolean(n))
}

function resolveZodImportNames(node: OperationNode, zodResolver: PluginZod['resolver']): Array<string> {
  const names: Array<string | undefined> = [zodResolver.resolveResponseName?.(node), node.requestBody?.schema ? zodResolver.resolveDataName?.(node) : undefined]
  return names.filter((n): n is string => Boolean(n))
}

export const classClientGenerator = defineGenerator<PluginClient>({
  name: 'classClient',
  operations(nodes, options) {
    const { adapter, config, driver, resolver, plugin } = this
    const { output, group, dataReturnType, paramsCasing, paramsType, pathParamsType, parser, importPath, wrapper } = options
    const baseURL = options.baseURL ?? adapter.rootNode?.meta?.baseURL
    const root = path.resolve(config.root, config.output.path)

    const pluginTs = driver.getPlugin<PluginTs>(pluginTsName)
    if (!pluginTs?.resolver) return null

    const tsResolver = pluginTs.resolver
    const tsPluginOptions = pluginTs.options
    const pluginZod = parser === 'zod' ? driver.getPlugin<PluginZod>(pluginZodName) : undefined
    const zodResolver = pluginZod?.resolver

    function buildOperationData(node: OperationNode): OperationData {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const typeFile = tsResolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output: tsPluginOptions?.output ?? output, group: tsPluginOptions?.group },
      )
      const zodFile =
        zodResolver && pluginZod?.options
          ? zodResolver.resolveFile(
              { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
              { root, output: pluginZod.options.output ?? output, group: pluginZod.options.group },
            )
          : undefined

      return {
        node: transformedNode,
        name: resolver.resolveName(transformedNode.operationId),
        tsResolver,
        zodResolver,
        typeFile,
        zodFile,
      }
    }

    const controllers = nodes.reduce(
      (acc, operationNode) => {
        const tag = operationNode.tags[0]
        const groupName = tag ? (group?.name?.({ group: camelCase(tag) }) ?? pascalCase(tag)) : 'Client'

        if (!tag && !group) {
          const name = 'ApiClient'
          const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group })
          const operationData = buildOperationData(operationNode)
          const previous = acc.find((item) => item.file.path === file.path)

          if (previous) {
            previous.operations.push(operationData)
          } else {
            acc.push({ name, file, operations: [operationData] })
          }
        } else if (tag) {
          const name = groupName
          const file = resolver.resolveFile({ name, extname: '.ts', tag }, { root, output, group })
          const operationData = buildOperationData(operationNode)
          const previous = acc.find((item) => item.file.path === file.path)

          if (previous) {
            previous.operations.push(operationData)
          } else {
            acc.push({ name, file, operations: [operationData] })
          }
        }

        return acc
      },
      [] as Array<Controller>,
    )

    function collectTypeImports(ops: Array<OperationData>) {
      const typeImportsByFile = new Map<string, Set<string>>()
      const typeFilesByPath = new Map<string, FabricFile.File>()

      ops.forEach((op) => {
        const names = resolveTypeImportNames(op.node, tsResolver)
        if (!typeImportsByFile.has(op.typeFile.path)) {
          typeImportsByFile.set(op.typeFile.path, new Set())
        }
        const imports = typeImportsByFile.get(op.typeFile.path)!
        names.forEach((n) => {
          imports.add(n)
        })
        typeFilesByPath.set(op.typeFile.path, op.typeFile)
      })

      return { typeImportsByFile, typeFilesByPath }
    }

    function collectZodImports(ops: Array<OperationData>) {
      const zodImportsByFile = new Map<string, Set<string>>()
      const zodFilesByPath = new Map<string, FabricFile.File>()

      ops.forEach((op) => {
        if (!op.zodFile || !zodResolver) return
        const names = resolveZodImportNames(op.node, zodResolver)
        if (!zodImportsByFile.has(op.zodFile.path)) {
          zodImportsByFile.set(op.zodFile.path, new Set())
        }
        const imports = zodImportsByFile.get(op.zodFile.path)!
        names.forEach((n) => {
          imports.add(n)
        })
        zodFilesByPath.set(op.zodFile.path, op.zodFile)
      })

      return { zodImportsByFile, zodFilesByPath }
    }

    const files = controllers.map(({ name, file, operations: ops }) => {
      const { typeImportsByFile, typeFilesByPath } = collectTypeImports(ops)
      const { zodImportsByFile, zodFilesByPath } =
        parser === 'zod' ? collectZodImports(ops) : { zodImportsByFile: new Map<string, Set<string>>(), zodFilesByPath: new Map<string, FabricFile.File>() }
      const hasFormData = ops.some((op) => op.node.requestBody?.contentType === 'multipart/form-data')

      return (
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
          footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
        >
          {importPath ? (
            <>
              <File.Import name={'fetch'} path={importPath} />
              <File.Import name={['mergeConfig']} path={importPath} />
              <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
            </>
          ) : (
            <>
              <File.Import name={['fetch']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
              <File.Import name={['mergeConfig']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
              <File.Import
                name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
                root={file.path}
                path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
                isTypeOnly
              />
            </>
          )}

          {hasFormData && <File.Import name={['buildFormData']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />}

          {Array.from(typeImportsByFile.entries()).map(([filePath, importSet]) => {
            const typeFile = typeFilesByPath.get(filePath)
            if (!typeFile) return null
            const importNames = Array.from(importSet).filter(Boolean)
            if (importNames.length === 0) return null
            return <File.Import key={filePath} name={importNames} root={file.path} path={typeFile.path} isTypeOnly />
          })}

          {parser === 'zod' &&
            Array.from(zodImportsByFile.entries()).map(([filePath, importSet]) => {
              const zodFile = zodFilesByPath.get(filePath)
              if (!zodFile) return null
              const importNames = Array.from(importSet).filter(Boolean)
              if (importNames.length === 0) return null
              return <File.Import key={filePath} name={importNames} root={file.path} path={zodFile.path} />
            })}

          <ClassClient
            name={name}
            operations={ops}
            baseURL={baseURL}
            dataReturnType={dataReturnType}
            pathParamsType={pathParamsType}
            paramsCasing={paramsCasing}
            paramsType={paramsType}
            parser={parser}
          />
        </File>
      )
    })

    if (wrapper) {
      const wrapperFile = resolver.resolveFile({ name: wrapper.className, extname: '.ts' }, { root, output, group })

      files.push(
        <File
          key={wrapperFile.path}
          baseName={wrapperFile.baseName}
          path={wrapperFile.path}
          meta={wrapperFile.meta}
          banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
          footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
        >
          {importPath ? (
            <File.Import name={['Client', 'RequestConfig']} path={importPath} isTypeOnly />
          ) : (
            <File.Import
              name={['Client', 'RequestConfig']}
              root={wrapperFile.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
              isTypeOnly
            />
          )}

          {controllers.map(({ name, file }) => (
            <File.Import key={name} name={[name]} root={wrapperFile.path} path={file.path} />
          ))}

          <WrapperClient name={wrapper.className} classNames={controllers.map(({ name }) => name)} />
        </File>,
      )
    }

    return files
  },
})

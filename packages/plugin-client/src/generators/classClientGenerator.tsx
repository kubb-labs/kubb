import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { ClassClient } from '../components/ClassClient'
import type { PluginClient } from '../types'

export const classClientGenerator = createReactGenerator<PluginClient>({
  name: 'classClient',
  Operations({ operations, generator, plugin, config }) {
    const { options, key: pluginKey } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getName, getFile, getGroup, getSchemas } = useOperationManager(generator)

    // Group operations by tag
    const controllers = operations.reduce(
      (acc, operation) => {
        const group = getGroup(operation)
        const groupName = group?.tag ? (options.group?.name?.({ group: camelCase(group.tag) }) ?? pascalCase(group.tag)) : 'Client'

        if (!group?.tag && !options.group) {
          // If no grouping, put all operations in a single class
          const name = 'ApiClient'
          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
          })

          const type = {
            file: getFile(operation, { pluginKey: [pluginTsName] }),
            schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
          }

          const zod = {
            file: getFile(operation, { pluginKey: [pluginZodName] }),
            schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
          }

          const operationData = {
            operation,
            name: getName(operation, { type: 'function' }),
            typeSchemas: type.schemas,
            zodSchemas: zod.schemas,
            typeFile: type.file,
            zodFile: zod.file,
          }

          const previousFile = acc.find((item) => item.file.path === file.path)

          if (previousFile) {
            previousFile.operations.push(operationData)
          } else {
            acc.push({ name, file, operations: [operationData] })
          }
        } else if (group?.tag) {
          // Group by tag
          const name = groupName
          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
            options: { group },
          })

          const type = {
            file: getFile(operation, { pluginKey: [pluginTsName] }),
            schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
          }

          const zod = {
            file: getFile(operation, { pluginKey: [pluginZodName] }),
            schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
          }

          const operationData = {
            operation,
            name: getName(operation, { type: 'function' }),
            typeSchemas: type.schemas,
            zodSchemas: zod.schemas,
            typeFile: type.file,
            zodFile: zod.file,
          }

          const previousFile = acc.find((item) => item.file.path === file.path)

          if (previousFile) {
            previousFile.operations.push(operationData)
          } else {
            acc.push({ name, file, operations: [operationData] })
          }
        }

        return acc
      },
      [] as Array<{
        name: string
        file: KubbFile.File
        operations: Array<{
          operation: any
          name: string
          typeSchemas: any
          zodSchemas: any
          typeFile: KubbFile.File
          zodFile: KubbFile.File
        }>
      }>,
    )

    return controllers.map(({ name, file, operations: ops }) => {
      // Collect imports grouped by file path
      const typeImportsByFile = new Map<string, Set<string>>()
      const zodImportsByFile = new Map<string, Set<string>>()
      const typeFilesByPath = new Map<string, KubbFile.File>()
      const zodFilesByPath = new Map<string, KubbFile.File>()
      const hasFormData = ops.some((op) => op.operation.getContentType() === 'multipart/form-data')

      ops.forEach((op) => {
        const { typeSchemas, zodSchemas, typeFile, zodFile } = op
        
        // Collect type imports by file
        if (!typeImportsByFile.has(typeFile.path)) {
          typeImportsByFile.set(typeFile.path, new Set())
        }
        const typeImports = typeImportsByFile.get(typeFile.path)!
        
        if (typeSchemas.request?.name) typeImports.add(typeSchemas.request.name)
        if (typeSchemas.response?.name) typeImports.add(typeSchemas.response.name)
        if (typeSchemas.pathParams?.name) typeImports.add(typeSchemas.pathParams.name)
        if (typeSchemas.queryParams?.name) typeImports.add(typeSchemas.queryParams.name)
        if (typeSchemas.headerParams?.name) typeImports.add(typeSchemas.headerParams.name)
        typeSchemas.statusCodes?.forEach((item: any) => {
          if (item.name) typeImports.add(item.name)
        })
        typeFilesByPath.set(typeFile.path, typeFile)

        // Collect zod imports by file if parser is zod
        if (options.parser === 'zod') {
          if (!zodImportsByFile.has(zodFile.path)) {
            zodImportsByFile.set(zodFile.path, new Set())
          }
          const zodImports = zodImportsByFile.get(zodFile.path)!
          
          if (zodSchemas?.response?.name) zodImports.add(zodSchemas.response.name)
          if (zodSchemas?.request?.name) zodImports.add(zodSchemas.request.name)
          zodFilesByPath.set(zodFile.path, zodFile)
        }
      })

      return (
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
          {options.importPath ? (
            <>
              <File.Import name={'fetch'} path={options.importPath} />
              <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.importPath} isTypeOnly />
            </>
          ) : (
            <>
              <File.Import name={['fetch']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
              <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} isTypeOnly />
            </>
          )}

          {hasFormData && <File.Import name={['buildFormData']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />}

          {Array.from(typeImportsByFile.entries()).map(([filePath, imports]) => {
            const typeFile = typeFilesByPath.get(filePath)
            if (!typeFile) return null
            const importNames = Array.from(imports).filter(Boolean)
            if (importNames.length === 0) return null
            return <File.Import key={filePath} name={importNames} root={file.path} path={typeFile.path} isTypeOnly />
          })}

          {options.parser === 'zod' &&
            Array.from(zodImportsByFile.entries()).map(([filePath, imports]) => {
              const zodFile = zodFilesByPath.get(filePath)
              if (!zodFile) return null
              const importNames = Array.from(imports).filter(Boolean)
              if (importNames.length === 0) return null
              return <File.Import key={filePath} name={importNames} root={file.path} path={zodFile.path} />
            })}

          <ClassClient
            name={name}
            operations={ops}
            baseURL={options.baseURL}
            dataReturnType={options.dataReturnType}
            pathParamsType={options.pathParamsType}
            paramsCasing={options.paramsCasing}
            paramsType={options.paramsType}
            parser={options.parser}
          />
        </File>
      )
    })
  },
})

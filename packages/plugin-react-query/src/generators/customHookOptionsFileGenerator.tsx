import fs from 'node:fs'
import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import type { Operation } from '@kubb/oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Function } from '@kubb/react-fabric'
import type { PluginReactQuery } from '../types'

export const customHookOptionsFileGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query-custom-hook-options-file',
  Operations({ operations, generator, plugin, config }) {
    const {
      options,
      options: { output },
      key: pluginKey,
    } = plugin
    const pluginManager = usePluginManager()

    const { getFile } = useOperationManager(generator)

    if (!options.customOptions) {
      return null
    }

    const override = output.override ?? false
    const { importPath, name } = options.customOptions

    const root = path.resolve(config.root, config.output.path)

    const reactQueryImportPath = options.query ? options.query.importPath : '@tanstack/react-query'

    const getHookFilePath = (operations: Operation[]) => {
      const firstOperation = operations[0]
      if (firstOperation != null) {
        // Get the file of the first generated hook
        return getFile(firstOperation, { prefix: 'use' }).path
      }
      // Get the index file of the hooks directory
      return pluginManager.getFile({ name: 'index', extname: '.ts', pluginKey }).path
    }

    const ensureExtension = (filePath: string, extname: string) => {
      if (path.extname(filePath) === '') {
        return filePath + extname
      }
      return filePath
    }

    const getExternalFile = (filePath: string, rootPath: string) => {
      const actualFilePath = ensureExtension(filePath, '.ts')
      return {
        baseName: path.basename(actualFilePath) as `${string}.${string}`,
        name: path.basename(actualFilePath, path.extname(actualFilePath)),
        path: path.resolve(rootPath, actualFilePath),
      }
    }

    const basePath = path.dirname(getHookFilePath(operations))
    const file = getExternalFile(importPath, basePath)

    if (fs.existsSync(file.path) && !override) {
      return null
    }

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Import name={['QueryClient']} path={reactQueryImportPath} isTypeOnly />
        <File.Import name={['useQueryClient']} path={reactQueryImportPath} />
        <File.Import name={['HookOptions']} root={file.path} path={path.resolve(root, './index.ts')} />
        <File.Source name={file.name} isExportable isIndexable>
          <Function name="getCustomHookOptions" params="{ queryClient }: { queryClient: QueryClient }" returnType="Partial<HookOptions>">
            {`return {
              // TODO: Define custom hook options here
              // Example:
              // useUpdatePetHook: {
              //   onSuccess: () => {
              //     void queryClient.invalidateQueries({ queryKey: ['pet'] })
              //   }
              // }
            }`}
          </Function>
          <Function
            name={name}
            generics="T extends keyof HookOptions"
            params="{ hookName, operationId }: { hookName: T, operationId: string }"
            returnType="HookOptions[T]"
            export
          >
            {`const queryClient = useQueryClient()
            const customOptions = getCustomHookOptions({ queryClient })
            return customOptions[hookName] ?? {}`}
          </Function>
        </File.Source>
      </File>
    )
  },
})

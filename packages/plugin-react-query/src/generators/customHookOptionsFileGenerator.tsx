import fs from 'node:fs'
import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { File, Function } from '@kubb/react-fabric'
import type { PluginReactQuery } from '../types'

export const customHookOptionsFileGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query-custom-hook-options-file',
  Operations({ config, plugin }) {
    const {
      options,
      options: { output },
      key: pluginKey,
    } = plugin
    const pluginManager = usePluginManager()

    if (!options.customOptions) {
      return null
    }

    const override = output.override ?? false
    const { importPath, name } = options.customOptions

    const root = path.resolve(config.root, config.output.path)

    const hookIndexFile = pluginManager.getFile({ name: 'index', extname: '.ts', pluginKey })

    const file = {
      baseName: path.basename(importPath) as `${string}.${string}`,
      name: path.basename(importPath, path.extname(importPath)),
      path: path.resolve(hookIndexFile.path, importPath),
    }

    if (fs.existsSync(file.path) && !override) {
      return null
    }

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Import name={['QueryClient']} path="@tanstack/react-query" isTypeOnly />
        <File.Import name={['useQueryClient']} path="@tanstack/react-query" />
        <File.Import name={['HookOptions']} root={file.path} path={path.resolve(root, './index.ts')} />
        <File.Source name={file.name}>
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
          <Function name={name} generics="T extends keyof HookOptions" params="{ hookName }: { hookName: T }" returnType="HookOptions[T]" export>
            {`const queryClient = useQueryClient()
            const customOptions = getCustomHookOptions({ queryClient })
            return customOptions[hookName] ?? {}`}
          </Function>
        </File.Source>
      </File>
    )
  },
})

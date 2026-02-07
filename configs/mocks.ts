import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createFile, FileProcessor } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect } from 'vitest'
import type { Plugin, PluginManager } from '../packages/core/src'
import { camelCase, pascalCase } from '../packages/core/src/transformers'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

export const createMockedPluginManager = (options: { name?: string; plugin?: Plugin<any>; config?: PluginManager['config'] } = {}) =>
  ({
    resolveName: (result) => {
      if (result.type === 'file') {
        return camelCase(options?.name || result.name)
      }

      if (result.type === 'type') {
        return pascalCase(result.name)
      }

      if (result.type === 'function') {
        return camelCase(result.name)
      }

      return camelCase(result.name)
    },
    config: options?.config ?? {
      root: '.',
      output: {
        path: './path',
      },
    },
    resolvePath: ({ baseName }) => baseName,
    getPluginByKey: (_pluginKey: Plugin['key']) => {
      return options?.plugin
    },
    getFile: ({ name, extname, pluginKey }) => {
      const baseName = `${name}${extname}`

      return {
        path: baseName,
        baseName,
        meta: { pluginKey },
      }
    },
    getPlugin(pluginName: Plugin['name']): Plugin | undefined {
      if (options?.plugin && options.plugin.name === pluginName) {
        return options.plugin
      }
      return (
        options.plugin ||
        ({
          name: pluginName,
          resolvers: [],
        } as unknown as Plugin)
      )
    },
  }) as PluginManager

export const mockedPluginManager = createMockedPluginManager()

export async function matchFiles(files: Array<KubbFile.ResolvedFile | KubbFile.File> | undefined, pre?: string) {
  if (!files?.length) return

  const fileProcessor = new FileProcessor()
  const parsers = new Map<KubbFile.Extname, any>()
  parsers.set('.ts', typescriptParser)

  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path) {
      continue
    }

    if (processed.has(file.path)) {
      continue
    }

    const parsed = await fileProcessor.parse(createFile(file), { parsers })
    const code = file.baseName.endsWith('.json') ? parsed : await format(parsed)

    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}

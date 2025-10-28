import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createFile, FileProcessor } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
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
export function format(source?: string): Promise<string> {
  if (!source) {
    return Promise.resolve('')
  }

  try {
    return prettierFormat(source, formatOptions)
  } catch (_e) {
    return Promise.resolve(source)
  }
}

export const createMockedPluginManager = (name?: string) =>
  ({
    resolveName: (result) => {
      if (result.type === 'file') {
        return camelCase(name || result.name)
      }

      if (result.type === 'type') {
        return pascalCase(result.name)
      }

      if (result.type === 'function') {
        return camelCase(result.name)
      }

      return camelCase(result.name)
    },
    config: {
      output: {
        path: './path',
      },
    },
    resolvePath: ({ baseName }) => baseName,
    logger: {
      emit(message) {
        console.log(message)
      },
      on(_eventName, _args) {},
      logLevel: 3,
    },
    getPluginByKey: (_pluginKey: Plugin['key']) => {
      return undefined
    },
    getFile: ({ name, extname, pluginKey }) => {
      const baseName = `${name}${extname}`

      return {
        path: baseName,
        baseName,
        meta: {
          pluginKey,
        },
      }
    },
  }) as PluginManager

export const mockedPluginManager = createMockedPluginManager('')

export async function matchFiles(files: Array<KubbFile.ResolvedFile | KubbFile.File> | undefined, pre?: string) {
  if (!files) {
    return undefined
  }

  const fileProcessor = new FileProcessor()
  const parsers = new Set<any>([typescriptParser])

  for await (const file of files) {
    const source = await fileProcessor.parse(createFile(file), { parsers })
    let code = source
    if (!file.baseName.endsWith('.json')) {
      code = await format(source)
    }

    await expect(code).toMatchFileSnapshot(path.join(...(['__snapshots__', pre, file.path].filter(Boolean) as string[])))
  }
}

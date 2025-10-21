import path from 'node:path'
import { createFile, FileProcessor } from '@kubb/fabric-core'
import { format } from '../../mocks/format.ts'
import type { File, ResolvedFile } from '../fs/types.ts'
import type { Logger } from '../logger'
import type { PluginManager } from '../PluginManager.ts'
import { camelCase, pascalCase } from '../transformers/casing.ts'
import type { Plugin } from '../types.ts'

export const mockedLogger = {
  emit(_type, _message) {},
  on(_type, _message) {},
  consola: {},
} as Logger

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

export async function matchFiles(files: Array<ResolvedFile | File> | undefined, pre?: string) {
  if (!files) {
    return undefined
  }

  const fileProcessor = new FileProcessor()

  for await (const file of files) {
    const source = await fileProcessor.parse(createFile(file))
    let code = source
    if (!file.baseName.endsWith('.json')) {
      code = await format(source)
    }

    await expect(code).toMatchFileSnapshot(path.join(...['__snapshots__', pre, file.path].filter(Boolean)))
  }
}

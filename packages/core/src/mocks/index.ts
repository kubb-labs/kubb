import { camelCase, pascalCase } from '../transformers/casing.ts'

import path from 'node:path'
import type { File, ResolvedFile } from '@kubb/fs/types'
import { getSource } from '../FileManager'
import type { PluginManager } from '../PluginManager.ts'
import type { Logger } from '../logger'
import type { Plugin } from '../types.ts'
import { createFile } from '../utils'

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

export async function matchFiles(files: Array<ResolvedFile | File> | undefined) {
  if (!files) {
    return undefined
  }

  for await (const file of files) {
    const source = await getSource(createFile(file), { logger: mockedLogger })
    await expect(source).toMatchFileSnapshot(path.join('__snapshots__', file.path))
  }
}

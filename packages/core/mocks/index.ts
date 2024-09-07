import { camelCase, pascalCase } from '../src/transformers/casing.ts'

import path from 'node:path'
import type { File, ResolvedFile } from '@kubb/fs/types'
import { getSource } from '../src/FileManager'
import type { PluginManager } from '../src/PluginManager.ts'
import type { Logger } from '../src/logger'
import { format } from './format'

export const mockedLogger = {
  emit(type, message) {},
  on(type, message) {},
  consola: {},
} as Logger

export const createMockedPluginManager = (name?: string) =>
  ({
    resolveName: (result) => {
      if (result.type === 'type') {
        return pascalCase(name || result.name)
      }

      if (result.type === 'function') {
        return camelCase(name || result.name)
      }

      return camelCase(name || result.name)
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
      on(eventName, args) {},
      logLevel: 3,
    },
    getFile: ({ name, extName, pluginKey }) => {
      const baseName = `${name}${extName}`

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

  for (const file of files) {
    const source = await getSource(file as ResolvedFile, { logger: mockedLogger })
    const formattedSource = await format(source)
    expect(formattedSource).toMatchFileSnapshot(path.join('__snapshots__', file.path))
  }
}

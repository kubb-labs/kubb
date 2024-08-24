import { pascalCase } from '../src/transformers/casing.ts'

import { readSync } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { FileManager } from '../src/FileManager'
import type { PluginManager } from '../src/PluginManager.ts'

export const mockedPluginManager = {
  resolveName: ({ name, type }) => {
    if (type === 'type') {
      return pascalCase(name)
    }

    return name
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
    logLevel: 'info',
  },
  getFile: ({ name, extName, pluginKey }) => {
    const baseName = `${name}${extName}`
    let source = ''

    try {
      source = readSync(baseName)
    } catch (_e) {
      //
    }

    return {
      path: baseName,
      baseName,
      meta: {
        pluginKey,
      },
      source,
    }
  },
} as PluginManager

export async function matchFiles(files?: KubbFile.File[]) {
  if(files){
    for (const file of files) {
      const source = await FileManager.getSource(file)
      expect(source).toMatchSnapshot()
    }
  }
}

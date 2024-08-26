import { pascalCase } from '../src/transformers/casing.ts'

import { readSync } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { getSource } from '../src/FileManager'
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
    logLevel: 3,
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
    }
  },
} as PluginManager

export async function matchFiles(files: Array<KubbFile.ResolvedFile | KubbFile.File>) {
  for (const file of files) {
    const source = await getSource(file as KubbFile.ResolvedFile)
    expect(source).toMatchSnapshot()
  }
}

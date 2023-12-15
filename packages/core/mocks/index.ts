import { pascalCase } from '../src/transformers/casing.ts'

import { PluginManager } from '../src/PluginManager.ts'
export const mockedPluginManager = {
  resolveName: ({ name, type }) => {
    if (type === 'type') {
      return pascalCase(name)
    }

    return name
  },
  resolvePath: ({ baseName }) => baseName,
  logger: {
    info(message) {
      console.log(message)
    },
    error(message) {
      console.log(message)
    },
    warn(message) {
      console.log(message)
    },
    log(message) {
      console.log(message)
    },
  },
} as PluginManager

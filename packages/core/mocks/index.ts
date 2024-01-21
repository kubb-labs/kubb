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
    emit(message) {
      console.log(message)
    },
    on(eventName, args) {
    },
    logLevel: 'info',
  },
} as PluginManager

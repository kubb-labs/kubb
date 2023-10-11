/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { cosmiconfig } from 'cosmiconfig'
import tsNode from 'ts-node'

import type { CosmiconfigResult } from '../types.ts'

// TODO fix tsLoader for node 20 when using ESM only
// https://github.com/TypeStrong/ts-node/issues/1997
const tsLoader = (configFile: string) => {
  let registerer = { enabled() {} }

  try {
    // Register TypeScript compiler instance
    registerer = tsNode.register({
      compilerOptions: { module: 'commonjs' },
      typeCheck: false,
    })

    const module = require(configFile)

    return module.default
  } catch (err) {
    const error = err as Error

    if (error.name === 'MODULE_NOT_FOUND') {
      throw new Error(`'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${error.message}`)
    }

    throw error
  } finally {
    registerer.enabled()
  }
}

export async function getCosmiConfig(moduleName: string, config?: string): Promise<CosmiconfigResult> {
  const searchPlaces = [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,

    `.${moduleName}rc.ts`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.cjs`,
    `.${moduleName}rc.mjs`,

    `${moduleName}.config.ts`,
    `${moduleName}.config.js`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.mjs`,
  ]
  const explorer = cosmiconfig(moduleName, {
    cache: false,
    searchPlaces: [
      ...searchPlaces.map((searchPlace) => {
        return `.config/${searchPlace}`
      }),
      ...searchPlaces.map((searchPlace) => {
        return `configs/${searchPlace}`
      }),
      ...searchPlaces,
    ],
    loaders: {
      '.ts': tsLoader,
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

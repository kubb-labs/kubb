/* eslint-disable @typescript-eslint/no-unsafe-return */
import { cosmiconfig } from 'cosmiconfig'
import tsNode from 'ts-node'
import yaml from 'yaml'

import { importModule } from './importModule.ts'

import type { CosmiconfigResult } from '../types.ts'

const jsLoader = async (configFile: string) => {
  return importModule(configFile)
}
// TODO fix tsLoader for node 20 when using ESM only
// https://github.com/TypeStrong/ts-node/issues/1997
const tsLoader = (configFile: string) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let registerer = { enabled() {} }

  try {
    // Register TypeScript compiler instance
    registerer = tsNode.register({
      compilerOptions: { module: 'commonjs' },
      swc: true,
      typeCheck: false,
    })

    const module = require(configFile)

    return module.default
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${err.message}`)
    }

    throw err
  } finally {
    registerer.enabled()
  }
}

export async function getCosmiConfig(moduleName: string, config?: string) {
  const explorer = cosmiconfig(moduleName, {
    cache: false,
    searchPlaces: [
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
    ],
    loaders: {
      '.yaml': (filepath, content) => yaml.parse(content),
      '.yml': (filepath, content) => yaml.parse(content),
      '.js': jsLoader,
      '.cjs': jsLoader,
      '.mjs': jsLoader,
      '.ts': tsLoader,
      noExt: jsLoader,
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

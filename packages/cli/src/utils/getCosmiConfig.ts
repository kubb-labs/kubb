import url from 'node:url'

import { cosmiconfig } from 'cosmiconfig'
import yaml from 'yaml'
import tsNode from 'ts-node'

import type { CosmiconfigResult } from '../types.ts'

const jsLoader = async (configFile: string) => {
  const module = await import(url.pathToFileURL(configFile).href)
  return module.default
}
// TODO fix tsLoader
// https://github.com/TypeStrong/ts-node/issues/1997
const tsLoader = async (configFile: string) => {
  let registerer = { enabled() {} }

  try {
    // Register TypeScript compiler instance
    registerer = tsNode.register({
      compilerOptions: {
        target: 'esnext',
        esModuleInterop: true,
        module: 'esnext', // "module": "CommonJS" should work too
        moduleResolution: 'Node',
      },
      esm: true,
      experimentalSpecifierResolution: 'explicit',
      swc: true,
      typeCheck: false,
    })

    const module = require(configFile)
    return module
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${err.message}`)
    }
    console.log(err)

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
      // TODO fix tsLoader
      // `.${moduleName}rc.ts`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.cjs`,
      `.${moduleName}rc.mjs`,
      // TODO fix tsLoader
      // `${moduleName}.config.ts`,
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
      // TODO fix tsLoader
      // '.ts': tsLoader,
      noExt: jsLoader,
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

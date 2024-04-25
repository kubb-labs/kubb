import { bundleRequire } from 'bundle-require'
import { cosmiconfigSync } from 'cosmiconfig'

import type { UserConfig, defineConfig } from '@kubb/core'
import { isPromise } from '@kubb/core/utils'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | UserConfig
}

const jsLoader = async (configFile: string) => {
  const { mod } = await bundleRequire({
    filepath: configFile,
    preserveTemporaryFile: false,
    format: 'cjs',
  })

  return mod.default || mod
}

const tsLoader = async (configFile: string) => {
  const { mod } = await bundleRequire({
    filepath: configFile,
    preserveTemporaryFile: false,
  })

  return mod.default || mod
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
    `.${moduleName}rc.mjs`,
    `.${moduleName}rc.cjs`,

    `${moduleName}.config.ts`,
    `${moduleName}.config.js`,
    `${moduleName}.config.mjs`,
    `${moduleName}.config.cjs`,
  ]
  // see https://github.com/cosmiconfig/cosmiconfig?tab=readme-ov-file#loading-js-modules why we use sync instead of async
  const explorer = cosmiconfigSync(moduleName, {
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
      '.mjs': tsLoader,
      '.js': jsLoader,
      '.cjs': jsLoader,
    },
  })

  const result = config ? explorer.load(config) : explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  if (isPromise(result.config)) {
    return {
      config: await result.config,
      filepath: result.filepath,
    } as CosmiconfigResult
  }

  return {
    config: result.config,
    filepath: result.filepath,
  } as CosmiconfigResult
}

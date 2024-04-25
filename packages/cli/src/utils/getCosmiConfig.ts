import { bundleRequire } from 'bundle-require'
import { cosmiconfig } from 'cosmiconfig'

import type { UserConfig, defineConfig } from '@kubb/core'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | UserConfig
}

const tsLoader = async (configFile: string) => {
  const { mod } = await bundleRequire({
    filepath: configFile,
    preserveTemporaryFile: false,
  })

  return mod.default
}

const jsLoader = async (configFile: string) => {
  const { mod } = await bundleRequire({
    filepath: configFile,
    preserveTemporaryFile: false,
    format: 'cjs',
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
      '.mjs': tsLoader,
      '.js': tsLoader,
      '.cjs': jsLoader,
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

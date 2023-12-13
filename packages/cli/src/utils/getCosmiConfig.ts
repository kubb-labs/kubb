/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { bundleRequire } from 'bundle-require'
import { cosmiconfig } from 'cosmiconfig'

import type { defineConfig, KubbUserConfig } from '@kubb/core'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | KubbUserConfig
}

const tsLoader = async (configFile: string) => {
  const { mod } = await bundleRequire({
    filepath: configFile,
  })

  return mod.default
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
      '.js': tsLoader,
      '.mjs': tsLoader,
      '.cjs': tsLoader,
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

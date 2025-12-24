import type { defineConfig, UserConfig } from '@kubb/core'
import { cosmiconfig } from 'cosmiconfig'
import { createJiti } from 'jiti'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | UserConfig
}

const tsLoader = async (configFile: string) => {
  const jiti = createJiti(configFile, {
    jsx: {
      runtime: 'automatic',
      importSource: '@kubb/react-fabric',
    },
    sourceMaps: true,
    interopDefault: true,
  })

  const mod = await jiti.import(configFile, { default: true })

  return mod
}

export async function getCosmiConfig(moduleName: string, config?: string): Promise<CosmiconfigResult> {
  let result: CosmiconfigResult
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
    },
  })

  try {
    result = config ? ((await explorer.load(config)) as CosmiconfigResult) : ((await explorer.search()) as CosmiconfigResult)
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

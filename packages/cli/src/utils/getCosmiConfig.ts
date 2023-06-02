/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable consistent-return */
import { cosmiconfig, defaultLoaders } from 'cosmiconfig'
// @ts-nocheck
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader'

import type { CosmiconfigResult } from '../types.ts'

export async function getCosmiConfig(moduleName: string, config?: string) {
  const explorer = cosmiconfig(moduleName, {
    cache: false,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      // commonjs
      `.${moduleName}rc.js`,
      `.${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.cjs`,
      // esm and typescript
      `.${moduleName}rc.ts`,
      `${moduleName}.config.ts`,
    ],
    loaders: {
      '.ts': TypeScriptLoader({
        swc: true,
        typeCheck: false,
      }),
      noExt: (defaultLoaders as any)['.ts'],
    },
  })

  const result = config ? await explorer.load(config) : await explorer.search()

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
}

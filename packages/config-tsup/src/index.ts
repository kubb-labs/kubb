import { promises as fs } from 'node:fs'
import { basename, resolve } from 'node:path'

import fg from 'fast-glob'
import c from 'tinyrainbow'

import type { Options } from 'tsup'

/**
 * This will make sure cjs with export default works perfect
 * @link https://github.com/unplugin/unplugin-starter/blob/main/scripts/postbuild.ts
 * @deprecated
 */
export async function forceDefaultExport(): Promise<void> {
  const files = await fg('*.cjs', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: resolve(process.cwd(), './dist'),
  })

  for (const file of files) {
    console.log(c.cyan('POST '), `Fix ${basename(file)}`)
    let code = await fs.readFile(file, 'utf8')
    code = code.replace('exports.default =', 'module.exports =')
    code += '\nexports.default = module.exports;'

    await fs.writeFile(file, code)
  }
}

export const bannerCJS: Options['banner'] = {}

export const bannerESM: Options['banner'] = {
  /**
   * @link https://stackoverflow.com/questions/31931614/require-is-not-defined-node-js
   */
  js: `
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  `,
}

export const options: Options = {
  entry: ['src/index.ts'],
  sourcemap: true,
  minify: false,
  clean: true,
  platform: 'node',
  shims: true,
  ignoreWatch: ['**/.turbo', '**/dist', '**/node_modules', '**/.DS_STORE', '**/.git'],
}

export const optionsESM: Options = {
  ...options,
  format: 'esm',
  dts: true,
  splitting: true,
}

export const optionsCJS: Options = {
  ...options,
  format: 'cjs',
  dts: true,
  splitting: true,
}

export default {
  default: options,
  esm: optionsESM,
  cjs: optionsCJS,
} as const

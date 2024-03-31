import path from 'node:path'

import { write } from '@kubb/core/fs'
import { LogLevel } from '@kubb/core/logger'
import { isPromiseFulfilledResult } from '@kubb/core/utils'

import { $ } from 'execa'
import c from 'tinyrainbow'

import { spinner } from './utils/spinner.ts'

type Preset = 'simple'

type PackageManager = 'pnpm' | 'npm' | 'yarn'

type PresetMeta = {
  'kubb.config': string
  packages: string[]
}

type InitProps = {
  /**
   * @default `'silent'`
   */
  logLevel?: LogLevel
  /**
   * @default `'simple'`
   */
  preset?: Preset
  /**
   * @default `'pnpm'`
   */
  packageManager?: PackageManager
}

const presets: Record<Preset, PresetMeta> = {
  simple: {
    'kubb.config': `
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'

export default defineConfig({
  root: '.',
  input: {
    path: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    done: ['echo "🎉 done"'],
  },
  plugins: [createSwagger({}), createSwaggerTS({ output: { path: 'models'}, enumType: 'enum' }), createSwaggerTanstackQuery({ output: { path: './hooks' } })],
})
  `,
    packages: ['@kubb/core', '@kubb/cli', '@kubb/swagger', '@kubb/swagger-ts', '@kubb/swagger-tanstack-query'],
  },
}

export async function init({ preset = 'simple', logLevel = LogLevel.silent, packageManager = 'pnpm' }: InitProps): Promise<undefined> {
  spinner.start('📦 Initializing Kubb')

  const presetMeta = presets[preset]
  const configPath = path.resolve(process.cwd(), './kubb.config.js')
  const installCommand = packageManager === 'npm' ? 'install' : 'add'

  spinner.start(`📀 Writing \`kubb.config.js\` ${c.dim(configPath)}`)
  await write(presetMeta['kubb.config'], configPath)
  spinner.succeed(`📀 Wrote \`kubb.config.js\` ${c.dim(configPath)}`)

  const results = await Promise.allSettled([
    $`npm init es6 -y`,
    ...presetMeta.packages.map(async (pack) => {
      spinner.start(`📀 Installing ${c.dim(pack)}`)
      const { stdout } = await $({
        preferLocal: false,
      })`${packageManager} ${installCommand} ${pack}`
      spinner.succeed(`📀 Installed ${c.dim(pack)}`)

      return stdout
    }),
  ])

  if (logLevel === LogLevel.info) {
    results.forEach((result) => {
      if (isPromiseFulfilledResult(result)) {
        console.log(result.value)
      }
    })
  }
  spinner.succeed('📦 initialized Kubb')

  return
}

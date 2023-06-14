import pathParser from 'node:path'

import { isPromiseFulfilledResult, write } from '@kubb/core'

import { $ } from 'execa'
import pc from 'picocolors'

import type { LogLevel } from '@kubb/core'
import { spinner } from './program.ts'

export type Preset = 'simple'

export type PackageManager = 'pnpm' | 'npm' | 'yarn'

export type PresetMeta = {
  'kubb.config': string
  packages: string[]
}

type RunProps = {
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
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'

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
    done: 'echo "🎉 done"',
  },
  logLevel: 'info',
  plugins: [createSwagger({}), createSwaggerTS({ output: 'models', enumType: 'enum' }), createSwaggerTanstackQuery({ output: './hooks' })],
})
  `,
    packages: ['@kubb/core', '@kubb/cli', '@kubb/swagger', '@kubb/swagger-ts', '@kubb/swagger-tanstack-query'],
  },
}

export async function init({ preset = 'simple', logLevel = 'silent', packageManager = 'pnpm' }: RunProps): Promise<undefined> {
  spinner.start('📦 Initializing Kubb')

  const presetMeta = presets[preset]
  const path = pathParser.resolve(process.cwd(), './kubb.config.js')
  const installCommand = packageManager === 'npm' ? 'install' : 'add'

  spinner.start(`📀 Writing \`kubb.config.js\` ${pc.dim(path)}`)
  await write(presetMeta['kubb.config'], path)
  spinner.succeed(`📀 Wrote \`kubb.config.js\` ${pc.dim(path)}`)

  const results = await Promise.allSettled([
    $`npm init es6 -y`,
    ...presetMeta.packages.map(async (pack) => {
      spinner.start(`📀 Installing ${pc.dim(pack)}`)
      const { stdout } = await $({ preferLocal: false })`${packageManager} ${installCommand} ${pack}`
      spinner.succeed(`📀 Installed ${pc.dim(pack)}`)

      return stdout
    }),
  ])

  if (logLevel === 'info') {
    results.forEach((result) => {
      if (isPromiseFulfilledResult(result)) {
        console.log(result.value)
      }
    })
  }
  spinner.succeed(`📦 initialized Kubb`)

  return
}

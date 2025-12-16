import process from 'node:process'
import type { Config } from '@kubb/core'
import { type KubbEvents, safeBuild } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { Options } from './types.ts'

type RollupContext = {
  warn?: (message: string) => void
  error?: (message: string | Error) => void
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const events = new AsyncEventEmitter<KubbEvents>()
  const isVite = meta.framework === 'vite'

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      ctx.error?.(`[${name}] Config is not set`)
      return
    }

    const { root: _root, ...userConfig } = options.config as Config

    const { error } = await safeBuild({
      config: {
        root: process.cwd(),
        ...userConfig,
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      events,
    })

    if (error) {
      ctx.error?.(error)
    } else {
      events.emit('success', 'Build finished')
    }
  }

  return {
    name,
    enforce: 'pre',
    apply: isVite ? 'build' : undefined,

    async buildStart() {
      await runBuild(this as unknown as RollupContext)
    },

    vite: {},
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

import { resolve } from 'node:path'
import process from 'node:process'
import { AsyncEventEmitter, URLPath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { type Config, createKubb, Diagnostics, fsCache, type KubbHooks, memoryStorage } from '@kubb/core'
import { middlewareBarrel, middlewareBarrelName } from '@kubb/middleware-barrel'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import type { UnpluginFactory } from 'unplugin'
import { version as unpluginVersion } from '../package.json'
import type { Options } from './types.ts'
import { buildVirtualStore, diffStores, loadVirtual, resolveVirtual, toResolvedId, type VirtualStore } from './virtual.ts'

type RollupContext = {
  info?: (message: string) => void
  warn?: (message: string) => void
  error?: (message: string) => void
  addWatchFile?: (id: string) => void
}

// The slice of the Vite dev server we use, kept loose so we don't pin a Vite version.
type ViteServerLike = {
  moduleGraph?: { getModuleById?: (id: string) => unknown }
  reloadModule?: (mod: unknown) => unknown
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const hooks = new AsyncEventEmitter<KubbHooks>()
  const isVite = meta.framework === 'vite'
  const virtual = !!options?.virtual

  let store: VirtualStore | null = null
  let inputPath: string | null = null
  let server: ViteServerLike | null = null
  let regenerating: Promise<void> | null = null

  hooks.on('kubb:lifecycle:start', ({ version }) => {
    console.log(`Kubb Unplugin ${version} 🧩`)
  })

  hooks.on('kubb:error', ({ error }) => {
    console.error(`✗ ${error?.message || 'failed'}`)
  })

  hooks.on('kubb:warn', ({ message }) => {
    console.warn(`⚠ ${message}`)
  })

  hooks.on('kubb:info', ({ message }) => {
    console.info(`ℹ ${message}`)
  })

  hooks.on('kubb:success', ({ message }) => {
    console.log(`✓ ${message}`)
  })

  hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
    const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

    console.log(`✓ ${plugin.name} completed in ${durationStr}`)
  })

  hooks.on('kubb:generation:end', ({ config, status, diagnostics }) => {
    console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')

    if (!diagnostics || !status) return

    const failedCount = Diagnostics.failedPlugins(diagnostics).length
    const pluginsCount = config.plugins.length
    const successCount = pluginsCount - failedCount

    console.log(
      status === 'success'
        ? `Kubb Summary: ✓ ${`${successCount} successful`}, ${pluginsCount} total`
        : `Kubb Summary: ✓ ${`${successCount} successful`}, ✗ ${`${failedCount} failed`}, ${pluginsCount} total`,
    )
  })

  // Builds the resolved Kubb config plus the output root and the spec path to watch. Mirrors the
  // `defineConfig` defaults (adapter, parsers, middleware, output, cache) and, in virtual mode,
  // forces `memoryStorage` so nothing is written to disk.
  function buildConfig(): { userConfig: Config; outputRoot: string; inputPath: string | null } | null {
    if (!options?.config) return null

    const middleware = options.config.middleware?.length ? options.config.middleware : [middlewareBarrel()]
    const hasBarrelMiddleware = middleware.some((m) => m.name === middlewareBarrelName)
    const output = { ...options.config.output }
    if (hasBarrelMiddleware && output.barrel === undefined) {
      output.barrel = { type: 'named' }
    }
    if (output.format === undefined) output.format = false
    if (output.lint === undefined) output.lint = false

    const storage = virtual ? memoryStorage() : options.config.storage

    const userConfig = {
      ...options.config,
      adapter: options.config.adapter ?? adapterOas(),
      parsers: options.config.parsers?.length ? options.config.parsers : [parserTs, parserTsx],
      middleware,
      output,
      cache: options.config.cache === undefined ? fsCache() : options.config.cache,
      ...(storage ? { storage } : {}),
    } as Config

    const root = userConfig.root || process.cwd()
    const input = userConfig.input
    const resolvedInput = input && 'path' in input && !new URLPath(input.path).isURL ? resolve(root, input.path) : null

    return { userConfig, outputRoot: resolve(root, output.path), inputPath: resolvedInput }
  }

  // Runs one generation pass. Returns the new virtual store (or `null` when not virtual or on
  // failure) without mutating shared state, so callers decide whether to swap it in.
  async function generate(): Promise<{ ok: boolean; nextStore: VirtualStore | null; message?: string; cause?: Error }> {
    const resolved = buildConfig()
    if (!resolved) {
      return { ok: false, nextStore: null, message: 'Config is not set' }
    }
    inputPath = resolved.inputPath

    const hrStart = process.hrtime()
    await hooks.emit('kubb:lifecycle:start', { version: unpluginVersion })

    const kubb = createKubb(resolved.userConfig, { hooks })
    await kubb.setup()
    const resolvedConfig = kubb.config ?? resolved.userConfig

    await hooks.emit('kubb:generation:start', { config: resolvedConfig })

    const { diagnostics, files, storage } = await kubb.safeBuild()
    const hasFailures = Diagnostics.hasError(diagnostics)

    // Surface every problem by severity. Unplugin has no diagnostic renderer, so route
    // errors/warnings/info to the channels it does listen on. Non-problem diagnostics are skipped.
    for (const diagnostic of diagnostics) {
      if (!Diagnostics.isProblem(diagnostic)) continue
      if (diagnostic.severity === 'error') {
        hooks.emit('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
      } else if (diagnostic.severity === 'warning') {
        hooks.emit('kubb:warn', { message: diagnostic.message })
      } else {
        hooks.emit('kubb:info', { message: diagnostic.message })
      }
    }

    await hooks.emit('kubb:generation:end', {
      config: resolvedConfig,
      storage,
      diagnostics,
      filesCreated: files.length,
      status: hasFailures ? 'failed' : 'success',
      hrStart,
    })
    await hooks.emit('kubb:lifecycle:end')

    if (hasFailures) {
      const failedCount = Diagnostics.failedPlugins(diagnostics).length
      const firstError = diagnostics.filter(Diagnostics.isProblem).find((diagnostic) => diagnostic.severity === 'error')
      const message = failedCount > 0 ? `Build Error with ${failedCount} failed plugins` : (firstError?.message ?? 'Build failed')
      return { ok: false, nextStore: null, message, cause: firstError?.cause }
    }

    const nextStore = virtual ? await buildVirtualStore({ storage, outputRoot: resolved.outputRoot }) : null
    return { ok: true, nextStore }
  }

  // Regenerates after the spec changes and pushes a targeted HMR update for the changed modules,
  // keeping the last good store when generation fails.
  async function regenerate(): Promise<void> {
    if (regenerating) return regenerating
    regenerating = (async () => {
      try {
        const result = await generate()
        if (!result.nextStore) return
        const { changed, removed } = diffStores(store, result.nextStore)
        store = result.nextStore
        if (!server) return
        for (const relativePath of [...changed, ...removed]) {
          const mod = server.moduleGraph?.getModuleById?.(toResolvedId(relativePath))
          if (mod) server.reloadModule?.(mod)
        }
      } finally {
        regenerating = null
      }
    })()
    return regenerating
  }

  return {
    name,
    enforce: 'pre',
    // Virtual mode must also run in dev (Vite serve), where HMR lives.
    apply: virtual ? undefined : isVite ? 'build' : undefined,
    async buildStart() {
      const ctx = this as unknown as RollupContext
      const result = await generate()
      if (result.nextStore) store = result.nextStore
      if (inputPath) ctx.addWatchFile?.(inputPath)

      if (!result.ok) {
        const message = `[${name}] ${result.message ?? 'Build failed'}`
        if (ctx.error) {
          ctx.error(message)
          return
        }
        throw new Error(message, { cause: result.cause })
      }
    },
    resolveId(id, importer) {
      if (!virtual || !store) return null
      return resolveVirtual({ id, importer: importer ?? undefined, store })
    },
    load(id) {
      if (!virtual || !store) return null
      const code = loadVirtual({ id, store })
      return code === null ? null : { code, map: null }
    },
    vite: {
      configureServer(viteServer) {
        server = viteServer as unknown as ViteServerLike
      },
      async hotUpdate(update) {
        if (!virtual || update.file !== inputPath) return
        await regenerate()
        return []
      },
    },
  }
}

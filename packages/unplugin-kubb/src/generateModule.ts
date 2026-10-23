import path from 'node:path'
import { adapterOas } from '@kubb/adapter-oas'
import {
  createKubb,
  Diagnostics,
  type Hookable,
  type KubbHooks,
  memoryStorage,
  type Output,
  type Plugin,
  type ProblemDiagnostic,
  type UserConfig,
} from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginBarrelName } from '@kubb/plugin-barrel'

export type GenerateModuleOptions = {
  /** Folder of the spec; relative imports in the module resolve from here. */
  root: string
  /** The spec: a path, its text, or the parsed document. */
  input: UserConfig['input']
  /** Config whose adapter and plugins run. Its `input`, `output`, hooks and reporters are not used. */
  config: UserConfig
  hooks?: Hookable<KubbHooks>
}

export type GenerateModuleResult = {
  /** The module as TypeScript, or `null` when the build failed. */
  text: string | null
  errors: Array<ProblemDiagnostic>
}

// Every plugin writes to this one file, so Kubb merges their output and drops the imports between them.
const moduleFile = 'index.ts'

const toModulePlugin = (plugin: Plugin): Plugin => ({
  ...plugin,
  options: {
    ...plugin.options,
    // An explicit `mode: 'directory'` would otherwise survive and write under `index.ts/`.
    output: { ...(plugin.options as { output?: Output } | undefined)?.output, path: moduleFile, mode: 'file' },
    group: undefined,
  },
})

/**
 * Generates the output of every plugin in `config` for one spec as a single TypeScript module,
 * without writing files or running the barrel plugin. Shared by the `*.openapi.yaml` loader and
 * the `openapi-import` content mapper, so both see the same exports.
 *
 * @example
 * ```ts
 * const { text } = await generateModule({ root: '/app/src', input: '/app/src/petStore.openapi.yaml', config })
 * ```
 */
export async function generateModule({ root, input, config, hooks }: GenerateModuleOptions): Promise<GenerateModuleResult> {
  const storage = memoryStorage()
  const kubb = createKubb(
    {
      root,
      input,
      output: { path: '.', barrel: false, format: false, lint: false },
      adapter: config.adapter ?? adapterOas(),
      parsers: [parserTs()],
      plugins: (config.plugins ?? []).filter((plugin) => plugin.name !== pluginBarrelName).map(toModulePlugin),
      storage,
    },
    { hooks },
  )

  const { diagnostics } = await kubb.safeBuild()
  const errors = diagnostics.filter(Diagnostics.isProblem).filter((diagnostic) => diagnostic.severity === 'error')
  // Files written elsewhere (a bundled client runtime) are left out; no output is an empty module.
  const text = errors.length ? null : ((await storage.readItem(path.resolve(root, moduleFile))) ?? '')

  return { text, errors }
}

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
  /**
   * Folder of the spec. Relative imports in the module resolve from here, as if the module sat
   * next to the spec.
   */
  root: string
  /**
   * The spec: a path, its text, or the parsed document.
   */
  input: UserConfig['input']
  /**
   * Kubb config whose adapter and plugins run. Its `input`, `output`, hooks and reporters are not used.
   */
  config: UserConfig
  /**
   * Hooks the build emits on, such as `kubb:generate:schema`.
   */
  hooks?: Hookable<KubbHooks>
}

export type GenerateModuleResult = {
  /**
   * The module as TypeScript, or `null` when the build failed.
   */
  text: string | null
  /**
   * Error-level problems of the build.
   */
  errors: Array<ProblemDiagnostic>
}

// Every plugin writes to this one file, so Kubb merges their output and drops the imports between them.
const moduleFile = 'index.ts'

/** Points a plugin at {@link moduleFile}. A single file has nothing to group. */
const toModulePlugin = (plugin: Plugin): Plugin => ({
  ...plugin,
  options: { ...plugin.options, output: { ...(plugin.options as { output?: Output } | undefined)?.output, path: moduleFile }, group: undefined },
})

/**
 * Generates the output of every plugin in `config` for one spec as a single TypeScript module,
 * without writing files. The barrel plugin is left out, since there is only one file. Used by
 * the `*.openapi.yaml` import loader and by the `openapi-import` TypeScript content mapper, so
 * a spec import has the same exports at build time and in the type checker.
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
  // Files a plugin writes elsewhere, such as a bundled client runtime, are not part of the module.
  const text = errors.length ? null : await storage.readItem(path.resolve(root, moduleFile))

  return { text, errors }
}

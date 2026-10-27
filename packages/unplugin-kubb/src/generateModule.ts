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
 * The config whose `input` is `fileName`, else the first one without an `input`. A config for
 * another spec does not apply, so it returns `undefined` when no config fits. A relative `root`
 * resolves from `cwd`, and `input` from `root`.
 */
export function selectConfig({ configs, fileName, cwd }: { configs: Array<UserConfig>; fileName: string; cwd: string }): UserConfig | undefined {
  const matches = (config: UserConfig) => typeof config.input === 'string' && path.resolve(cwd, config.root || '.', config.input) === path.resolve(fileName)

  return configs.find(matches) ?? configs.find((config) => config.input === undefined)
}

/**
 * Generates the output of every plugin in `config` for one spec as one TypeScript module, without
 * writing files. Only `config`'s adapter and plugins are used. `text` is empty when `errors` is not.
 * `sources` lists the files and URLs the adapter read, such as the ones external `$ref`s point at,
 * so a watcher can rebuild when one changes.
 * The `*.openapi.yaml` loader and the `openapi-import` content mapper share it.
 */
export async function generateModule({
  root,
  input,
  config,
  hooks,
}: {
  /** Folder of the spec; relative imports in the module resolve from here. */
  root: string
  input: UserConfig['input']
  config: UserConfig
  hooks?: Hookable<KubbHooks>
}): Promise<{ text: string; errors: Array<ProblemDiagnostic>; sources: Array<string> }> {
  const storage = memoryStorage()
  const adapter = config.adapter ?? adapterOas()
  const { diagnostics } = await createKubb(
    {
      root,
      input,
      output: { path: '.', barrel: false, format: false, lint: false },
      adapter,
      parsers: [parserTs()],
      plugins: (config.plugins ?? []).filter((plugin) => plugin.name !== pluginBarrelName).map(toModulePlugin),
      storage,
    },
    { hooks },
  ).safeBuild()
  const errors = diagnostics.filter(Diagnostics.isProblem).filter((diagnostic) => diagnostic.severity === 'error')
  // Files written elsewhere (a bundled client runtime) are left out; no output is an empty module.
  const text = errors.length ? '' : ((await storage.readItem(path.resolve(root, moduleFile))) ?? '')

  return { text, errors, sources: adapter.sources ?? [] }
}

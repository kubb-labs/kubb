import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'
import { defineWithTypes } from 'gunshi'
import { resolveCommand } from 'package-manager-detector'
import { ConfigEditOperation, editConfig, generateConfigFile, initDefaults, KUBB_CONFIG_FILENAME, KUBB_PACKAGE_NAME } from '@internals/shared'
import { exists, formatMs, getElapsedMs, write } from '@internals/utils'
import { createKubb, Diagnostics, type RegistryEntry } from '@kubb/core'
import { dryRunId, type DryRunExtensions } from '../../commands/shared.ts'
import { getConfigs } from '../../config.ts'
import { isHttpUrl, pluralize } from '../../ui/text.ts'
import { isInteractiveRun, logIntro, logOutro } from '../../ui/intro.ts'
import { logBlock, logError, logStep, logWarn } from '../../ui/log.ts'
import { withSpinner } from '../../ui/spinner.ts'
import { fetchRegistryIndex, incompatibility, installSpec, registryUrl } from '../../utils/registry.ts'
import { installWithSpinner } from '../installWithSpinner.ts'
import {
  addGenerateScript,
  detectPackageManager,
  findPlugin,
  findSpecFiles,
  generateScript,
  initPackageJson,
  installPackages,
  missingPluginDependencies,
  type PackageManagerInfo,
  parsePluginsFlag,
  readSpecInfo,
} from './utils.ts'
import { version } from '../../../package.json'

function cancelAndExit(message = 'Operation canceled.'): never {
  clack.cancel(message)
  process.exit(0)
}

function unwrap<T>(value: T): Exclude<T, symbol> {
  if (clack.isCancel(value)) cancelAndExit()
  return value as Exclude<T, symbol>
}

type InitOptions = {
  /**
   * When `true`, skips all interactive prompts and uses the detected or default values.
   */
  yes: boolean
  /**
   * Input path flag value from `--input`. When provided, skips the input prompt.
   */
  input?: string
  /**
   * Output directory flag value from `--output`. When provided, skips the output prompt.
   */
  output?: string
  /**
   * Comma-separated plugin list from `--plugins`, e.g. `'plugin-ts,zod'`. When provided, skips the plugin selection prompt.
   */
  plugins?: string
  /**
   * Dry-run extension from `@gunshi/plugin-dryrun`. When enabled, package installation, file
   * writes, and the first run are skipped.
   */
  dryRun: DryRunExtension
}

type Choices = {
  inputPath: string
  outputPath: string
  plugins: Array<RegistryEntry>
}

/** The full `kubb.config.ts` for `choices`, with each plugin added the way `kubb add` adds it. */
function buildConfig({ inputPath, outputPath, plugins }: Choices): string {
  const { source, outcomes } = editConfig({
    source: generateConfigFile({ inputPath, outputPath }),
    edits: plugins.map((entry) => ({ operation: ConfigEditOperation.ADD_PLUGIN, plugin: entry.artifact.package })),
    extensions: new Map(plugins.map(({ artifact, manifest }) => [artifact.package, { package: artifact.package, version: artifact.version, manifest }])),
  })
  const failed = outcomes.find((outcome) => !outcome.applied)
  if (failed && failed.edit.operation === ConfigEditOperation.ADD_PLUGIN)
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `Could not add ${failed.edit.plugin} to ${KUBB_CONFIG_FILENAME}: ${failed.reason}`,
      help: `Run kubb init without that plugin, then add it with kubb add.`,
    })
  return source
}

/** Generates from the config at `configPath` without reporters, and returns how many files it wrote. */
async function firstRun(configPath: string): Promise<number> {
  const { configs } = await getConfigs({ configPath })
  let files = 0
  for (const config of configs) {
    const result = await createKubb(config).generate()
    if (!result.success) throw new Error(result.diagnostics.flatMap((diagnostic) => (diagnostic.severity === 'error' ? [diagnostic.message] : [])).join('\n'))
    files += result.files.length
  }
  return files
}

/** The command that runs `kubb generate`: the `generate` script when it runs Kubb, otherwise `npx kubb generate`. */
function generateCommand({ packageManager, script, watch }: { packageManager: PackageManagerInfo; script: string | undefined; watch: boolean }): string {
  if (script !== 'kubb generate') return `npx kubb generate${watch ? ' --watch' : ''}`
  const { command, args } = resolveCommand(packageManager.agent, 'run', watch ? ['generate', '--watch'] : ['generate'])!
  return [command, ...args].join(' ')
}

/**
 * Runs the Kubb setup wizard: detects the package manager and specs, asks for the spec, plugins, and
 * output folder, shows the config for review, then installs, writes `kubb.config.ts`, adds a
 * `generate` script, and runs the first generation.
 * Pass `yes: true` to skip all prompts and print one line per step.
 */
export async function run({ yes, input: inputFlag, output: outputFlag, plugins: pluginsFlag, dryRun }: InitOptions): Promise<void> {
  const cwd = process.cwd()

  if (!yes) logIntro({ title: isInteractiveRun({ yes, dryRun: dryRun.enabled }) ? undefined : 'Set up Kubb' })

  try {
    // Start the registry fetch now but await it only at the plugin step, so the first prompt never waits on the network
    const registry = fetchRegistryIndex({ registry: registryUrl() }).then((entries) =>
      entries.filter((entry) => entry.kind === 'plugin' && !incompatibility(entry.manifest)),
    )
    registry.catch(() => {})

    if (!(await exists(path.join(cwd, 'package.json')))) {
      if (!yes) {
        const shouldInit = unwrap(await clack.confirm({ message: 'No package.json found. Would you like to create one?', initialValue: true }))
        if (!shouldInit) cancelAndExit()
      }

      const packageManager = await detectPackageManager(cwd)
      await withSpinner({
        message: `Initializing package.json with ${packageManager.name}`,
        promise: initPackageJson(cwd, packageManager),
        done: () => `Created package.json with ${packageManager.name}`,
        failed: 'Could not create package.json',
        plain: yes,
      })
    }

    const packageManager = await detectPackageManager(cwd)
    const specs = await findSpecFiles(cwd)

    if (!yes) {
      logStep(`Package manager  ${packageManager.name}`)
      if (specs[0]) {
        const { version: specVersion, operations } = await readSpecInfo(path.join(cwd, specs[0]))
        const details = [
          specs[0].slice(2),
          specVersion ? `${specVersion.startsWith('2') ? 'Swagger' : 'OpenAPI'} ${specVersion}` : undefined,
          operations === undefined ? undefined : pluralize(operations, 'operation'),
          specs.length > 1 ? `+${specs.length - 1} more` : undefined,
        ]
        logStep(`Found     ${details.filter(Boolean).join(' · ')}`)
      }
    }

    // `--plugins` and `--yes` need the registry before any prompt; the interactive path reads it at the plugin step
    const plugins = pluginsFlag || yes ? await registry : undefined
    const defaultPlugins = (entries: Array<RegistryEntry>) => initDefaults.plugins.flatMap((id) => findPlugin({ plugins: entries, id }) ?? [])

    const flagPlugins = pluginsFlag && plugins ? parsePluginsFlag({ plugins, value: pluginsFlag }) : undefined

    let choices: Choices = {
      inputPath: inputFlag ?? specs[0] ?? initDefaults.inputPath,
      outputPath: outputFlag ?? initDefaults.outputPath,
      plugins: flagPlugins ?? (plugins ? defaultPlugins(plugins) : []),
    }
    if (yes && !choices.plugins.length) {
      throw new Error('The registry has no default plugin. Pass --plugins to choose one.')
    }

    async function askInput(current: string): Promise<string> {
      const choice = specs.length
        ? unwrap(
            await clack.select({
              message: 'Which spec should Kubb read?',
              options: [
                ...specs.map((spec) => ({ value: spec, label: spec, hint: 'found in this repo' })),
                { value: 'url', label: 'A URL' },
                { value: 'file', label: 'Another file' },
              ],
              initialValue: specs.includes(current) ? current : isHttpUrl(current) ? 'url' : 'file',
            }),
          )
        : isHttpUrl(current)
          ? 'url'
          : 'file'
      if (specs.includes(choice)) return choice
      const isUrl = choice === 'url'
      const initial = isUrl === isHttpUrl(current) && !specs.includes(current) ? current : undefined
      return unwrap(
        await clack.text({
          message: isUrl ? 'Spec URL' : 'Spec path',
          placeholder: isUrl ? 'https://example.com/openapi.yaml' : initDefaults.inputPath,
          initialValue: initial,
          defaultValue: isUrl ? undefined : initDefaults.inputPath,
          validate: (value) => {
            if (isUrl && !isHttpUrl(value ?? '')) return 'Enter an http(s) URL'
          },
        }),
      )
    }

    async function askPlugins(previous: Array<RegistryEntry>): Promise<Array<RegistryEntry>> {
      const plugins = await registry
      const current = previous.length ? previous : defaultPlugins(plugins)
      const width = Math.max(...plugins.map((entry) => entry.manifest.displayName.length))
      const nameWidth = Math.max(...plugins.map((entry) => entry.manifest.name.length))
      const values = unwrap(
        await clack.multiselect({
          message: 'What should Kubb generate?',
          options: plugins.map(({ id, manifest }) => ({
            value: id,
            label: `${manifest.displayName.padEnd(width)}  ${styleText('dim', manifest.name.padEnd(nameWidth))}`.trimEnd(),
          })),
          initialValues: current.map((entry) => entry.id),
          required: true,
        }),
      )
      return plugins.filter((entry) => values.includes(entry.id))
    }

    // Flags for all three choices leave nothing to ask or review, as before the review step existed
    const answered = yes || Boolean(inputFlag && outputFlag && pluginsFlag)
    if (!answered) {
      let firstPass = true
      while (true) {
        // The first pass skips the questions a flag answered; "Change a choice" asks them all again.
        choices = {
          inputPath: firstPass && inputFlag ? inputFlag : await askInput(choices.inputPath),
          plugins: firstPass && flagPlugins ? flagPlugins : await askPlugins(choices.plugins),
          outputPath:
            firstPass && outputFlag
              ? outputFlag
              : unwrap(await clack.text({ message: 'Output folder', placeholder: choices.outputPath, defaultValue: choices.outputPath })),
        }
        firstPass = false
        const missing = missingPluginDependencies(choices.plugins.map((entry) => entry.manifest))
        if (missing.length) {
          logWarn(`${missing.join('\n')}\nAdd the missing plugins.`)
          continue
        }
        const config = buildConfig(choices)
        const packages = [KUBB_PACKAGE_NAME, ...choices.plugins.map((entry) => entry.artifact.package)]
        logStep(`Review ${KUBB_CONFIG_FILENAME}`)
        logBlock([...config.trimEnd().split('\n'), '', `${styleText('dim', 'Installs')}  ${packages.join(' ')} with ${packageManager.name}`])
        const configExists = await exists(path.join(cwd, KUBB_CONFIG_FILENAME))
        const confirmed = unwrap(
          await clack.select({
            message: configExists ? `${KUBB_CONFIG_FILENAME} exists. Overwrite it?` : 'Create it?',
            options: [
              { value: true, label: 'Yes' },
              { value: false, label: 'Change a choice' },
            ],
          }),
        )
        if (confirmed) break
      }
    }

    // Check the selection against the plugins' manifests before installing anything
    const missing = missingPluginDependencies(choices.plugins.map((entry) => entry.manifest))
    if (missing.length) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.missingDependency,
        severity: 'error',
        message: `${missing.join('\n')}\nAdd the missing plugins and run kubb init again.`,
      })
    }

    const configPath = path.join(cwd, KUBB_CONFIG_FILENAME)
    if (answered && !yes && (await exists(configPath))) {
      const overwrite = unwrap(await clack.confirm({ message: `${KUBB_CONFIG_FILENAME} exists. Overwrite it?`, initialValue: false }))
      if (!overwrite) cancelAndExit('Keeping existing configuration.')
    }

    // Install `kubb` at the running CLI's version and each plugin at the version the registry pins
    const packagesToInstall = [`${KUBB_PACKAGE_NAME}@${version}`, ...choices.plugins.map((entry) => installSpec(entry.artifact))]
    const packageNames = [KUBB_PACKAGE_NAME, ...choices.plugins.map((entry) => entry.artifact.package)]
    const dry = { message: `install ${packagesToInstall.length} packages with ${packageManager.name}` }
    if (yes) {
      await withSpinner({
        message: '',
        promise: dryRun.run(() => installPackages(packagesToInstall, packageManager, cwd), dry),
        done: () => `Installed ${packageNames.join(' ')} with ${packageManager.name}`,
        plain: true,
      })
    } else {
      await installWithSpinner({
        packages: packagesToInstall,
        names: `${packagesToInstall.length} packages`,
        packageManager,
        cwd,
        install: async (packages, packageManager, cwd, onLine) => void (await dryRun.run(() => installPackages(packages, packageManager, cwd, onLine), dry)),
      })
    }

    await withSpinner({
      message: `Writing ${KUBB_CONFIG_FILENAME}`,
      promise: dryRun.run(async () => void (await write(configPath, buildConfig(choices))), { message: `write ${KUBB_CONFIG_FILENAME}` }),
      done: () => `Wrote ${KUBB_CONFIG_FILENAME}`,
      failed: `Could not write ${KUBB_CONFIG_FILENAME}`,
      plain: yes,
    })

    const scriptAdded = await dryRun.run(() => addGenerateScript(cwd), {
      message: 'add a generate script to package.json',
      resolve: async () => (await generateScript(cwd)) === undefined,
    })
    if (scriptAdded && !yes) logStep('Added "generate": "kubb generate" to package.json')

    const script = scriptAdded ? 'kubb generate' : await generateScript(cwd)
    const runStart = process.hrtime()
    try {
      await dryRun.run(
        () =>
          withSpinner({
            message: 'Running the first generation',
            promise: firstRun(configPath),
            done: (files) =>
              yes
                ? `Generated ${pluralize(files, 'file')} in ${choices.outputPath}`
                : `First run  ${pluralize(files, 'file')} in ${choices.outputPath} · ${formatMs(getElapsedMs(runStart))}`,
            failed: 'First run failed',
            plain: yes,
          }),
        { message: 'run the first generation', resolve: () => 0 },
      )
    } catch (error) {
      logError(error instanceof Error ? error.message : String(error))
      const message = `Kubb is set up, but the first run failed. Fix the error, then run ${generateCommand({ packageManager, script, watch: false })}.`
      if (yes) console.log(message)
      else logOutro(styleText('yellow', message))
      process.exitCode = 1
      return
    }

    if (yes) {
      console.log(`Kubb is set up. Run ${generateCommand({ packageManager, script, watch: false })} after changing the spec.`)
      return
    }
    logOutro(`${styleText('green', '✓ Kubb is set up')}\n   ${styleText('dim', 'Next')}  ${generateCommand({ packageManager, script, watch: true })}`)
  } catch (error) {
    logError(styleText('red', 'An error occurred during initialization'))
    if (error instanceof Error) {
      logError(error.message)
    }
    process.exit(1)
  }
}

export const command = defineWithTypes<{ extensions: DryRunExtensions }>()({
  name: 'init',
  description: 'Set up a config, install plugins, and run the first generation.',
  examples: [
    'kubb init',
    'kubb init --yes',
    'kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod',
    'kubb init --yes --input ./openapi.yaml --plugins ts,zod --output src/api',
    'kubb init --plugins plugin-ts,plugin-axios,plugin-react-query',
    'kubb init --yes --dry-run',
  ].join('\n'),
  toKebab: true,
  args: {
    yes: {
      type: 'boolean',
      description: 'Skip prompts and use the detected spec, the default plugin, and the default output folder',
      short: 'y',
      default: false,
    },
    input: {
      type: 'string',
      description: 'Path to the OpenAPI specification',
      short: 'i',
      metavar: 'path',
    },
    output: {
      type: 'string',
      description: 'Output directory for generated files',
      short: 'o',
      metavar: 'path',
    },
    plugins: {
      type: 'string',
      description:
        'Comma-separated Kubb registry ids of the plugins to add, the same ids `kubb add` takes (plugin-ts, plugin-zod, acme/plugin-x), or short names (ts, zod)',
      metavar: 'plugin-ts,plugin-zod,...',
    },
  },
  run: ({ values, extensions }) => run({ yes: values.yes, input: values.input, output: values.output, plugins: values.plugins, dryRun: extensions[dryRunId] }),
})

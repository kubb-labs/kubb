import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'
import { defineWithTypes } from 'gunshi'
import { generateConfigFile, initDefaults, KUBB_CONFIG_FILENAME, KUBB_PACKAGE_NAME } from '@internals/shared'
import { Diagnostics, type RegistryEntry } from '@kubb/core'
import { dryRunId, type DryRunExtensions } from '../../commands/shared.ts'
import { createSpinner, logError, logInfo, logIntro, logOutro } from '../../loggers/output.ts'
import { addToConfig } from '../add/run.ts'
import { fetchRegistryIndex, incompatibility, installSpec, registryUrl, toRegistryId } from '../../utils/registry.ts'
import { detectPackageManager, initPackageJson, installPackages, missingPluginDependencies } from './utils.ts'
import { version } from '../../../package.json'

function cancelAndExit(message = 'Operation canceled.'): never {
  clack.cancel(message)
  process.exit(0)
}

type InitOptions = {
  /**
   * When `true`, skips all interactive prompts and uses default values.
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
   * Comma-separated plugin list from `--plugins`, e.g. `'plugin-ts,plugin-zod'`. When provided, skips the plugin selection prompt.
   */
  plugins?: string
  /**
   * Dry-run extension from `@gunshi/plugin-dryrun`. When enabled, package installation and the
   * config file write are skipped.
   */
  dryRun: DryRunExtension
}

/**
 * Runs the interactive Kubb scaffolding wizard.
 * Detects the package manager, prompts for input/output paths and plugins, installs packages, and writes `kubb.config.ts`.
 * Pass `yes: true` to skip all prompts and use defaults.
 */
export async function run({ yes, input: inputFlag, output: outputFlag, plugins: pluginsFlag, dryRun }: InitOptions): Promise<void> {
  const cwd = process.cwd()

  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Init ')) })

  /**
   * Returns `flag` when provided, the `defaultValue` when `yes` is set,
   * or calls `prompt()` for interactive input. Exits on cancellation.
   */
  async function resolveOrPrompt<T>(flag: T | undefined, defaultValue: T, logLabel: string, prompt: () => Promise<NoInfer<T> | symbol>): Promise<T> {
    if (flag !== undefined) {
      logInfo(`${logLabel}: ${styleText('cyan', String(flag))}`)
      return flag
    }
    if (yes) {
      logInfo(`${logLabel}: ${styleText('cyan', String(defaultValue))}`)
      return defaultValue
    }
    const result = await prompt()
    if (clack.isCancel(result)) cancelAndExit()
    return result as T
  }

  try {
    // The plugins come from the Kubb registry, like `kubb add`, so read it before changing anything
    const plugins = (await fetchRegistryIndex({ registry: registryUrl() })).filter((entry) => entry.kind === 'plugin' && !incompatibility(entry.manifest))
    const byId = new Map(plugins.map((entry) => [entry.id, entry]))

    // Check/create package.json, detect package manager once after the block
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
      if (!yes) {
        const shouldInit = await clack.confirm({
          message: 'No package.json found. Would you like to create one?',
          initialValue: true,
        })

        if (clack.isCancel(shouldInit) || !shouldInit) {
          cancelAndExit()
        }
      }

      const packageManager = detectPackageManager(cwd)
      const spinner = createSpinner()
      spinner.start(`Initializing package.json with ${packageManager.name}`)
      await initPackageJson(cwd, packageManager)
      spinner.stop(`Created package.json with ${packageManager.name}`)
    }

    const packageManager = detectPackageManager(cwd)
    logInfo(`Detected package manager: ${styleText('cyan', packageManager.name)}`)

    // Prompt for OpenAPI spec path
    const inputPath = await resolveOrPrompt(inputFlag, initDefaults.inputPath, 'Using input path', () =>
      clack.text({
        message: 'Where is your OpenAPI specification located?',
        placeholder: initDefaults.inputPath,
        defaultValue: initDefaults.inputPath,
        validate: (value) => {
          if (!value) return 'Input path is required'
        },
      }),
    )

    // Prompt for output directory
    const outputPath = await resolveOrPrompt(outputFlag, initDefaults.outputPath, 'Using output path', () =>
      clack.text({
        message: 'Where should the generated files be output?',
        placeholder: initDefaults.outputPath,
        defaultValue: initDefaults.outputPath,
        validate: (value) => {
          if (!value) return 'Output path is required'
        },
      }),
    )

    // Plugin selection
    const defaultPlugins = initDefaults.plugins.flatMap((slug) => byId.get(toRegistryId(slug)) ?? [])
    const pluginLabel = (entries: Array<RegistryEntry>) => styleText('cyan', entries.map((entry) => entry.manifest.displayName).join(', '))

    const selectedPlugins: Array<RegistryEntry> = await (async () => {
      if (pluginsFlag) {
        const ids = pluginsFlag
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
        const unknown = ids.filter((id) => !byId.has(toRegistryId(id)))
        if (unknown.length)
          throw new Diagnostics.Error({
            code: Diagnostics.code.pluginNotFound,
            severity: 'error',
            message: `Not in the Kubb registry: ${unknown.join(', ')}. Browse the plugins at https://kubb.dev/extensions.`,
            help: 'Use plugin ids from https://kubb.dev/extensions, such as plugin-ts.',
          })
        const entries = ids.map((id) => byId.get(toRegistryId(id))!)
        logInfo(`Using plugins: ${pluginLabel(entries)}`)
        return entries
      }
      if (yes) {
        logInfo(`Using plugins: ${pluginLabel(defaultPlugins)}`)
        return defaultPlugins
      }
      const values = await clack.multiselect({
        message: 'Select plugins to use:',
        options: plugins.map(({ id, manifest }) => ({ value: id, label: manifest.displayName, hint: manifest.category })),
        initialValues: defaultPlugins.map((entry) => entry.id),
        required: true,
      })
      if (clack.isCancel(values)) cancelAndExit()
      return plugins.filter((entry) => (values as Array<string>).includes(entry.id))
    })()

    // Check the selection against the plugins' manifests before installing anything
    const missing = missingPluginDependencies({
      selected: selectedPlugins.map((entry) => entry.manifest.name),
      manifests: selectedPlugins.map((entry) => entry.manifest),
    })
    if (missing.length) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.missingDependency,
        severity: 'error',
        message: `${missing.join('\n')}\nAdd the missing plugins and run kubb init again.`,
      })
    }

    // Install `kubb` at the running CLI's version and each plugin at the version the registry pins
    const packagesToInstall = [`${KUBB_PACKAGE_NAME}@${version}`, ...selectedPlugins.map((entry) => installSpec(entry.artifact))]

    const spinner = createSpinner()
    spinner.start(`Installing ${packagesToInstall.length} packages with ${packageManager.name}`)

    try {
      await dryRun.run(() => installPackages(packagesToInstall, packageManager, cwd), {
        message: `install ${packagesToInstall.length} packages with ${packageManager.name}`,
      })
      spinner.stop(`Installed ${packagesToInstall.length} packages`)
    } catch (error) {
      spinner.stop('Installation failed')
      throw error
    }

    // Generate config file
    const configSpinner = createSpinner()
    configSpinner.start(`Creating ${KUBB_CONFIG_FILENAME}`)

    const configContent = generateConfigFile({ inputPath, outputPath })
    const configPath = path.join(cwd, KUBB_CONFIG_FILENAME)

    if (fs.existsSync(configPath)) {
      configSpinner.stop(`${KUBB_CONFIG_FILENAME} already exists`)

      if (!yes) {
        const shouldOverwrite = await clack.confirm({
          message: `${KUBB_CONFIG_FILENAME} already exists. Overwrite?`,
          initialValue: false,
        })

        if (clack.isCancel(shouldOverwrite) || !shouldOverwrite) {
          cancelAndExit('Keeping existing configuration. Packages have been installed.')
        }
      }

      configSpinner.start(`Overwriting ${KUBB_CONFIG_FILENAME}`)
    }

    await dryRun.run(() => fs.promises.writeFile(configPath, configContent, 'utf-8'), { message: `write ${KUBB_CONFIG_FILENAME}` })

    // Add each plugin the way `kubb add` does
    for (const entry of selectedPlugins) {
      const reason = await dryRun.run(() => addToConfig({ detail: entry, configFile: configPath }), {
        message: `add ${entry.manifest.export}() to ${KUBB_CONFIG_FILENAME}`,
        resolve: () => undefined,
      })
      if (reason)
        throw new Diagnostics.Error({
          code: Diagnostics.code.unknown,
          severity: 'error',
          message: `Could not add ${entry.manifest.export}() to ${KUBB_CONFIG_FILENAME}: ${reason}`,
          help: `Add ${entry.manifest.export}() to the plugins array in ${KUBB_CONFIG_FILENAME} by hand.`,
        })
    }

    configSpinner.stop(`Created ${KUBB_CONFIG_FILENAME}`)

    logOutro(
      styleText('green', '✓ All set!') +
        '\n\n' +
        styleText('dim', 'Next steps:') +
        '\n' +
        styleText('cyan', `  1. Make sure your OpenAPI spec is at: ${inputPath}`) +
        '\n' +
        styleText('cyan', '  2. Generate code with: npx kubb generate') +
        '\n' +
        styleText('cyan', `  3. Find generated files in: ${outputPath}`) +
        '\n\n' +
        styleText('dim', `Using ${packageManager.name} • Kubb v${version}`),
    )
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
  description:
    'Scaffold a kubb.config.ts and install plugins for code generation from an OpenAPI spec. Run without flags for interactive setup, or pass --input, --output, and --plugins to skip the prompts.',
  examples: [
    'kubb init',
    'kubb init --yes',
    'kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod',
    'kubb init --plugins plugin-ts,plugin-axios,plugin-react-query',
    'kubb init --yes --dry-run',
  ].join('\n'),
  toKebab: true,
  args: {
    yes: {
      type: 'boolean',
      description: 'Skip prompts and use default options',
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
      description: 'Comma-separated Kubb registry ids of the plugins to add, the same ids `kubb add` takes (plugin-ts, plugin-zod, acme/plugin-x)',
      metavar: 'plugin-ts,plugin-zod,...',
    },
  },
  run: ({ values, extensions }) => run({ yes: values.yes, input: values.input, output: values.output, plugins: values.plugins, dryRun: extensions[dryRunId] }),
})

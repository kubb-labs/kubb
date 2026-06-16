import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { detectPackageManager } from '@internals/utils'
import { availablePlugins, generateConfigFile, initDefaults, KUBB_CONFIG_FILENAME, type PluginOption } from '@internals/shared'
import { hasPackageJson, initPackageJson, installPackages } from './utils.ts'

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
   * Current `@kubb/cli` version string, shown in the closing outro.
   */
  version: string
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
}

/**
 * Runs the interactive Kubb scaffolding wizard.
 * Detects the package manager, prompts for input/output paths and plugins, installs packages, and writes `kubb.config.ts`.
 * Pass `yes: true` to skip all prompts and use defaults.
 */
export async function run({ yes, version, input: inputFlag, output: outputFlag, plugins: pluginsFlag }: InitOptions): Promise<void> {
  const cwd = process.cwd()

  clack.intro(styleText('bgCyan', styleText('black', ' Kubb Init ')))

  /**
   * Returns `flag` when provided, the `defaultValue` when `yes` is set,
   * or calls `prompt()` for interactive input. Exits on cancellation.
   */
  async function resolveOrPrompt<T>(flag: T | undefined, defaultValue: T, logLabel: string, prompt: () => Promise<T | symbol>): Promise<T> {
    if (flag !== undefined) {
      clack.log.info(`${logLabel}: ${styleText('cyan', String(flag))}`)
      return flag
    }
    if (yes) {
      clack.log.info(`${logLabel}: ${styleText('cyan', String(defaultValue))}`)
      return defaultValue
    }
    const result = await prompt()
    if (clack.isCancel(result)) cancelAndExit()
    return result as T
  }

  try {
    // Check/create package.json, detect package manager once after the block
    if (!hasPackageJson(cwd)) {
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
      const spinner = clack.spinner()
      spinner.start(`Initializing package.json with ${packageManager.name}`)
      await initPackageJson(cwd, packageManager)
      spinner.stop(`Created package.json with ${packageManager.name}`)
    }

    const packageManager = detectPackageManager(cwd)
    if (hasPackageJson(cwd)) {
      clack.log.info(`Detected package manager: ${styleText('cyan', packageManager.name)}`)
    }

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
    const defaultPlugins = availablePlugins.filter((p) => (initDefaults.plugins as ReadonlyArray<string>).includes(p.value))
    const pluginLabel = (plugins: Array<PluginOption>) => styleText('cyan', plugins.map((p) => p.label).join(', '))

    const selectedPlugins: Array<PluginOption> = await (async () => {
      if (pluginsFlag) {
        const requested = pluginsFlag
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
        const plugins = availablePlugins.filter((p) => requested.includes(p.value))
        if (plugins.length === 0) {
          clack.log.warn(`No valid plugins found in --plugins value; falling back to default: ${pluginLabel(defaultPlugins)}`)
          return defaultPlugins
        }
        clack.log.info(`Using plugins: ${pluginLabel(plugins)}`)
        return plugins
      }
      if (yes) {
        clack.log.info(`Using plugins: ${pluginLabel(defaultPlugins)}`)
        return defaultPlugins
      }
      const values = await clack.multiselect({
        message: 'Select plugins to use:',
        options: availablePlugins.map(({ value, label, hint }) => ({ value, label, hint })),
        initialValues: [...initDefaults.plugins],
        required: true,
      })
      if (clack.isCancel(values)) cancelAndExit()
      return availablePlugins.filter((p) => (values as Array<string>).includes(p.value))
    })()

    // Install packages
    const packagesToInstall = ['kubb', ...selectedPlugins.map((p) => p.packageName)]

    const spinner = clack.spinner()
    spinner.start(`Installing ${packagesToInstall.length} packages with ${packageManager.name}`)

    try {
      await installPackages(packagesToInstall, packageManager, cwd)
      spinner.stop(`Installed ${packagesToInstall.length} packages`)
    } catch (error) {
      spinner.stop('Installation failed')
      throw error
    }

    // Generate config file
    const configSpinner = clack.spinner()
    configSpinner.start(`Creating ${KUBB_CONFIG_FILENAME}`)

    const configContent = generateConfigFile({ selectedPlugins, inputPath, outputPath })
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

    await fs.promises.writeFile(configPath, configContent, 'utf-8')

    configSpinner.stop(`Created ${KUBB_CONFIG_FILENAME}`)

    clack.outro(
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
    clack.log.error(styleText('red', 'An error occurred during initialization'))
    if (error instanceof Error) {
      clack.log.error(error.message)
    }
    process.exit(1)
  }
}

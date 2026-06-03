import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { availablePlugins, generateConfigFile, initDefaults, KUBB_CONFIG_FILENAME, type PluginOption } from '@internals/shared'
import { detectPackageManager } from '@internals/utils'
import { consola } from 'consola'
import { hasPackageJson, initPackageJson, installPackages } from './utils.ts'

function cancelAndExit(message = 'Operation cancelled.'): never {
  consola.warn(message)
  process.exit(0)
}

function unwrap<T>(value: T): Exclude<T, symbol> {
  if (typeof value === 'symbol') cancelAndExit()
  return value as Exclude<T, symbol>
}

type InitOptions = {
  /**
   * When `true`, skips all interactive prompts and uses default values.
   */
  yes: boolean
  /**
   * Current `@kubb/cli` version string, shown in the outro and used for package installation.
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

  consola.box(styleText('bgCyan', styleText('black', ' Kubb Init ')))

  async function resolveOrPrompt<T>(flag: T | undefined, defaultValue: T, logLabel: string, prompt: () => Promise<T>): Promise<T> {
    if (flag !== undefined) {
      consola.info(`${logLabel}: ${styleText('cyan', String(flag))}`)
      return flag
    }
    if (yes) {
      consola.info(`${logLabel}: ${styleText('cyan', String(defaultValue))}`)
      return defaultValue
    }
    return prompt()
  }

  async function promptRequiredText(message: string, fallback: string, missingMessage: string): Promise<string> {
    while (true) {
      const raw = await consola.prompt(message, {
        type: 'text',
        placeholder: fallback,
        default: fallback,
        cancel: 'symbol',
      })
      const value = unwrap(raw)
      if (value) return value
      consola.warn(missingMessage)
    }
  }

  try {
    if (!hasPackageJson(cwd)) {
      if (!yes) {
        const shouldInit = unwrap(
          await consola.prompt('No package.json found. Would you like to create one?', {
            type: 'confirm',
            initial: true,
            cancel: 'symbol',
          }),
        )
        if (!shouldInit) cancelAndExit()
      }

      const packageManager = detectPackageManager(cwd)
      consola.start(`Initializing package.json with ${packageManager.name}`)
      await initPackageJson(cwd, packageManager)
      consola.success(`Created package.json with ${packageManager.name}`)
    }

    const packageManager = detectPackageManager(cwd)
    if (hasPackageJson(cwd)) {
      consola.info(`Detected package manager: ${styleText('cyan', packageManager.name)}`)
    }

    const inputPath = await resolveOrPrompt(inputFlag, initDefaults.inputPath, 'Using input path', () =>
      promptRequiredText('Where is your OpenAPI specification located?', initDefaults.inputPath, 'Input path is required'),
    )

    const outputPath = await resolveOrPrompt(outputFlag, initDefaults.outputPath, 'Using output path', () =>
      promptRequiredText('Where should the generated files be output?', initDefaults.outputPath, 'Output path is required'),
    )

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
          consola.warn(`No valid plugins found in --plugins value; falling back to default: ${pluginLabel(defaultPlugins)}`)
          return defaultPlugins
        }
        consola.info(`Using plugins: ${pluginLabel(plugins)}`)
        return plugins
      }
      if (yes) {
        consola.info(`Using plugins: ${pluginLabel(defaultPlugins)}`)
        return defaultPlugins
      }
      const raw = await consola.prompt('Select plugins to use:', {
        type: 'multiselect',
        options: availablePlugins.map(({ value, label, hint }) => ({ value, label, hint })),
        initial: [...initDefaults.plugins],
        required: true,
        cancel: 'symbol',
      })
      const values = unwrap(raw) as unknown as Array<string>
      return availablePlugins.filter((p) => values.includes(p.value))
    })()

    const packagesToInstall = ['kubb', ...selectedPlugins.map((p) => p.packageName)]

    consola.start(`Installing ${packagesToInstall.length} packages with ${packageManager.name}`)
    try {
      await installPackages(packagesToInstall, packageManager, cwd)
      consola.success(`Installed ${packagesToInstall.length} packages`)
    } catch (error) {
      consola.fail('Installation failed')
      throw error
    }

    consola.start(`Creating ${KUBB_CONFIG_FILENAME}`)

    const configContent = generateConfigFile({ selectedPlugins, inputPath, outputPath })
    const configPath = path.join(cwd, KUBB_CONFIG_FILENAME)

    if (fs.existsSync(configPath)) {
      consola.info(`${KUBB_CONFIG_FILENAME} already exists`)

      if (!yes) {
        const shouldOverwrite = unwrap(
          await consola.prompt(`${KUBB_CONFIG_FILENAME} already exists. Overwrite?`, {
            type: 'confirm',
            initial: false,
            cancel: 'symbol',
          }),
        )

        if (!shouldOverwrite) {
          cancelAndExit('Keeping existing configuration. Packages have been installed.')
        }
      }

      consola.start(`Overwriting ${KUBB_CONFIG_FILENAME}`)
    }

    await fs.promises.writeFile(configPath, configContent, 'utf-8')

    consola.success(`Created ${KUBB_CONFIG_FILENAME}`)

    consola.box(
      [
        styleText('green', '✓ All set!'),
        '',
        styleText('dim', 'Next steps:'),
        styleText('cyan', `  1. Make sure your OpenAPI spec is at: ${inputPath}`),
        styleText('cyan', '  2. Generate code with: npx kubb generate'),
        styleText('cyan', '     Or start a stream server with: npx kubb agent start'),
        styleText('cyan', `  3. Find generated files in: ${outputPath}`),
        '',
        styleText('dim', `Using ${packageManager.name} • Kubb v${version}`),
      ].join('\n'),
    )
  } catch (error) {
    consola.error(styleText('red', 'An error occurred during initialization'))
    if (error instanceof Error) {
      consola.error(error.message)
    }
    process.exit(1)
  }
}

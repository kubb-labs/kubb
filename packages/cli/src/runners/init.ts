import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { PackageManagerInfo } from '@internals/utils'
import { detectPackageManager } from '@internals/utils'
import { availablePlugins, generateConfigFile, initDefaults, KUBB_CONFIG_FILENAME, type PluginOption } from '@internals/shared'
import { hasPackageJson, initPackageJson, installPackages } from '../utils/packageManager.ts'

function cancelAndExit(message = 'Operation cancelled.'): never {
  clack.cancel(message)
  process.exit(0)
}

type InitOptions = {
  yes: boolean
  version: string
  input?: string
  output?: string
  plugins?: string
}

export async function runInit({ yes, version, input: inputFlag, output: outputFlag, plugins: pluginsFlag }: InitOptions): Promise<void> {
  const cwd = process.cwd()

  clack.intro(styleText('bgCyan', styleText('black', ' Kubb Init ')))

  try {
    // Check/create package.json
    let packageManager: PackageManagerInfo
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

      packageManager = detectPackageManager(cwd)

      const spinner = clack.spinner()
      spinner.start(`Initializing package.json with ${packageManager.name}`)

      await initPackageJson(cwd, packageManager)

      spinner.stop(`Created package.json with ${packageManager.name}`)
    } else {
      packageManager = detectPackageManager(cwd)
      clack.log.info(`Detected package manager: ${styleText('cyan', packageManager.name)}`)
    }

    // Prompt for OpenAPI spec path
    let inputPath: string
    if (inputFlag) {
      inputPath = inputFlag
      clack.log.info(`Using input path: ${styleText('cyan', inputPath)}`)
    } else if (yes) {
      inputPath = initDefaults.inputPath
      clack.log.info(`Using input path: ${styleText('cyan', inputPath)}`)
    } else {
      const inputPathResult = await clack.text({
        message: 'Where is your OpenAPI specification located?',
        placeholder: initDefaults.inputPath,
        defaultValue: initDefaults.inputPath,
        validate: (value) => {
          if (!value) return 'Input path is required'
        },
      })

      if (clack.isCancel(inputPathResult)) {
        cancelAndExit()
      }
      inputPath = inputPathResult as string
    }

    // Prompt for output directory
    let outputPath: string
    if (outputFlag) {
      outputPath = outputFlag
      clack.log.info(`Using output path: ${styleText('cyan', outputPath)}`)
    } else if (yes) {
      outputPath = initDefaults.outputPath
      clack.log.info(`Using output path: ${styleText('cyan', outputPath)}`)
    } else {
      const outputPathResult = await clack.text({
        message: 'Where should the generated files be output?',
        placeholder: initDefaults.outputPath,
        defaultValue: initDefaults.outputPath,
        validate: (value) => {
          if (!value) return 'Output path is required'
        },
      })

      if (clack.isCancel(outputPathResult)) {
        cancelAndExit()
      }
      outputPath = outputPathResult as string
    }

    // Plugin selection
    let selectedPlugins: PluginOption[]
    if (pluginsFlag) {
      const requestedValues = pluginsFlag
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      selectedPlugins = availablePlugins.filter((plugin) => requestedValues.includes(plugin.value))
      if (selectedPlugins.length === 0) {
        selectedPlugins = availablePlugins.filter((plugin) => (initDefaults.plugins as readonly string[]).includes(plugin.value))
        clack.log.warn(
          `No valid plugins found in --plugins value; falling back to default: ${styleText('cyan', selectedPlugins.map((p) => p.label).join(', '))}`,
        )
      } else {
        clack.log.info(`Using plugins: ${styleText('cyan', selectedPlugins.map((p) => p.label).join(', '))}`)
      }
    } else if (yes) {
      selectedPlugins = availablePlugins.filter((plugin) => (initDefaults.plugins as readonly string[]).includes(plugin.value))
      clack.log.info(`Using plugins: ${styleText('cyan', selectedPlugins.map((p) => p.label).join(', '))}`)
    } else {
      const selectedPluginValues = await clack.multiselect({
        message: 'Select plugins to use:',
        options: availablePlugins.map((plugin) => ({
          value: plugin.value,
          label: plugin.label,
          hint: plugin.hint,
        })),
        initialValues: [...initDefaults.plugins],
        required: true,
      })

      if (clack.isCancel(selectedPluginValues)) {
        cancelAndExit()
      }

      selectedPlugins = availablePlugins.filter((plugin) => (selectedPluginValues as string[]).includes(plugin.value))
    }

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

    const configContent = generateConfigFile(selectedPlugins, inputPath, outputPath)
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

    fs.writeFileSync(configPath, configContent, 'utf-8')

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
        styleText('cyan', '     Or start a stream server with: npx kubb start') +
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

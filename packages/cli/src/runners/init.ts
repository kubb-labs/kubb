import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { detectPackageManager, type PackageManagerInfo } from '@kubb/core/utils'
import { initDefaults, pluginDefaultConfigs } from '../constants.ts'
import { hasPackageJson, initPackageJson, installPackages } from '../utils/packageManager.ts'

type PluginOption = {
  value: string
  label: string
  hint?: string
  packageName: string
  importName: string
  category: 'core' | 'typescript' | 'query' | 'validation' | 'testing' | 'mocking' | 'docs'
}

const availablePlugins: PluginOption[] = [
  {
    value: 'plugin-oas',
    label: 'OpenAPI Parser',
    hint: 'Required',
    packageName: '@kubb/plugin-oas',
    importName: 'pluginOas',
    category: 'core',
  },
  {
    value: 'plugin-ts',
    label: 'TypeScript',
    hint: 'Recommended',
    packageName: '@kubb/plugin-ts',
    importName: 'pluginTs',
    category: 'typescript',
  },
  {
    value: 'plugin-client',
    label: 'Client (Fetch/Axios)',
    packageName: '@kubb/plugin-client',
    importName: 'pluginClient',
    category: 'typescript',
  },
  {
    value: 'plugin-react-query',
    label: 'React Query / TanStack Query',
    packageName: '@kubb/plugin-react-query',
    importName: 'pluginReactQuery',
    category: 'query',
  },
  {
    value: 'plugin-solid-query',
    label: 'Solid Query',
    packageName: '@kubb/plugin-solid-query',
    importName: 'pluginSolidQuery',
    category: 'query',
  },
  {
    value: 'plugin-svelte-query',
    label: 'Svelte Query',
    packageName: '@kubb/plugin-svelte-query',
    importName: 'pluginSvelteQuery',
    category: 'query',
  },
  {
    value: 'plugin-vue-query',
    label: 'Vue Query',
    packageName: '@kubb/plugin-vue-query',
    importName: 'pluginVueQuery',
    category: 'query',
  },
  {
    value: 'plugin-swr',
    label: 'SWR',
    packageName: '@kubb/plugin-swr',
    importName: 'pluginSwr',
    category: 'query',
  },
  {
    value: 'plugin-zod',
    label: 'Zod Schemas',
    packageName: '@kubb/plugin-zod',
    importName: 'pluginZod',
    category: 'validation',
  },
  {
    value: 'plugin-faker',
    label: 'Faker.js Mocks',
    packageName: '@kubb/plugin-faker',
    importName: 'pluginFaker',
    category: 'mocking',
  },
  {
    value: 'plugin-msw',
    label: 'MSW Handlers',
    packageName: '@kubb/plugin-msw',
    importName: 'pluginMsw',
    category: 'mocking',
  },
  {
    value: 'plugin-cypress',
    label: 'Cypress Tests',
    packageName: '@kubb/plugin-cypress',
    importName: 'pluginCypress',
    category: 'testing',
  },
  {
    value: 'plugin-redoc',
    label: 'ReDoc Documentation',
    packageName: '@kubb/plugin-redoc',
    importName: 'pluginRedoc',
    category: 'docs',
  },
]

function generateConfigFile(selectedPlugins: PluginOption[], inputPath: string, outputPath: string): string {
  const imports = selectedPlugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`).join('\n')

  const pluginConfigs = selectedPlugins
    .map((plugin) => {
      const config = (pluginDefaultConfigs as Record<string, string>)[plugin.value] ?? `${plugin.importName}()`
      return `    ${config},`
    })
    .join('\n')

  return `import { defineConfig } from '@kubb/core'
${imports}

export default defineConfig({
  root: '.',
  input: {
    path: '${inputPath}',
  },
  output: {
    path: '${outputPath}',
    clean: true,
  },
  plugins: [
${pluginConfigs}
  ],
})
`
}

function cancelAndExit(message = 'Operation cancelled.'): never {
  clack.cancel(message)
  process.exit(0)
}

type InitOptions = {
  yes: boolean
  version: string
}

export async function runInit({ yes, version }: InitOptions): Promise<void> {
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
    if (yes) {
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
    if (yes) {
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
    if (yes) {
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

    // Ensure plugin-oas is always included
    if (!selectedPlugins.find((p) => p.value === 'plugin-oas')) {
      selectedPlugins.unshift(availablePlugins.find((p) => p.value === 'plugin-oas')!)
    }

    // Install packages
    const packagesToInstall = ['@kubb/core', '@kubb/cli', '@kubb/agent', ...selectedPlugins.map((p) => p.packageName)]

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
    configSpinner.start('Creating kubb.config.ts')

    const configContent = generateConfigFile(selectedPlugins, inputPath, outputPath)
    const configPath = path.join(cwd, 'kubb.config.ts')

    if (fs.existsSync(configPath)) {
      configSpinner.stop('kubb.config.ts already exists')

      if (!yes) {
        const shouldOverwrite = await clack.confirm({
          message: 'kubb.config.ts already exists. Overwrite?',
          initialValue: false,
        })

        if (clack.isCancel(shouldOverwrite) || !shouldOverwrite) {
          cancelAndExit('Keeping existing configuration. Packages have been installed.')
        }
      }

      configSpinner.start('Overwriting kubb.config.ts')
    }

    fs.writeFileSync(configPath, configContent, 'utf-8')

    configSpinner.stop('Created kubb.config.ts')

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

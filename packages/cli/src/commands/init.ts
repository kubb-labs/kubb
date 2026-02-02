import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import { defineCommand } from 'citty'
import pc from 'picocolors'
import { version } from '../../package.json'
import { detectPackageManager, hasPackageJson, initPackageJson, installPackages, type PackageManagerInfo } from '../utils/packageManager.ts'

type PluginOption = {
  value: string
  label: string
  hint?: string
  packageName: string
  importName: string
  category: 'core' | 'typescript' | 'query' | 'validation' | 'testing' | 'mocking' | 'docs'
}

const plugins: PluginOption[] = [
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
      if (plugin.value === 'plugin-oas') {
        return '    pluginOas(),'
      }
      if (plugin.value === 'plugin-ts') {
        return `    pluginTs({\n      output: {\n        path: 'models',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-client') {
        return `    pluginClient({\n      output: {\n        path: 'clients',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-react-query') {
        return `    pluginReactQuery({\n      output: {\n        path: 'hooks',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-zod') {
        return `    pluginZod({\n      output: {\n        path: 'zod',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-faker') {
        return `    pluginFaker({\n      output: {\n        path: 'mocks',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-msw') {
        return `    pluginMsw({\n      output: {\n        path: 'msw',\n      },\n    }),`
      }
      if (plugin.value === 'plugin-swr') {
        return `    pluginSwr({\n      output: {\n        path: 'hooks',\n      },\n    }),`
      }
      // Default config for other plugins
      return `    ${plugin.importName}(),`
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

const command = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize a new Kubb project with interactive setup',
  },
  async run() {
    const cwd = process.cwd()

    clack.intro(pc.bgCyan(pc.black(' Kubb Init ')))

    try {
      // Check/create package.json
      let packageManager: PackageManagerInfo
      if (!hasPackageJson(cwd)) {
        const shouldInit = await clack.confirm({
          message: 'No package.json found. Would you like to create one?',
          initialValue: true,
        })

        if (clack.isCancel(shouldInit) || !shouldInit) {
          clack.cancel('Operation cancelled.')
          process.exit(0)
        }

        // Detect package manager before initializing
        packageManager = detectPackageManager(cwd)

        const spinner = clack.spinner()
        spinner.start(`Initializing package.json with ${packageManager.name}`)

        await initPackageJson(cwd, packageManager)

        spinner.stop(`Created package.json with ${packageManager.name}`)
      } else {
        packageManager = detectPackageManager(cwd)
        clack.log.info(`Detected package manager: ${pc.cyan(packageManager.name)}`)
      }

      // Prompt for OpenAPI spec path
      const inputPath = await clack.text({
        message: 'Where is your OpenAPI specification located?',
        placeholder: './openapi.yaml',
        defaultValue: './openapi.yaml',
        validate: (value) => {
          if (!value) return 'Input path is required'
        },
      })

      if (clack.isCancel(inputPath)) {
        clack.cancel('Operation cancelled.')
        process.exit(0)
      }

      // Prompt for output directory
      const outputPath = await clack.text({
        message: 'Where should the generated files be output?',
        placeholder: './src/gen',
        defaultValue: './src/gen',
        validate: (value) => {
          if (!value) return 'Output path is required'
        },
      })

      if (clack.isCancel(outputPath)) {
        clack.cancel('Operation cancelled.')
        process.exit(0)
      }

      // Plugin selection
      const selectedPluginValues = await clack.multiselect({
        message: 'Select plugins to use:',
        options: plugins.map((plugin) => ({
          value: plugin.value,
          label: plugin.label,
          hint: plugin.hint,
        })),
        initialValues: ['plugin-oas', 'plugin-ts'],
        required: true,
      })

      if (clack.isCancel(selectedPluginValues)) {
        clack.cancel('Operation cancelled.')
        process.exit(0)
      }

      const selectedPlugins = plugins.filter((plugin) => (selectedPluginValues as string[]).includes(plugin.value))

      // Ensure plugin-oas is always included
      if (!selectedPlugins.find((p) => p.value === 'plugin-oas')) {
        selectedPlugins.unshift(plugins.find((p) => p.value === 'plugin-oas')!)
      }

      // Install packages
      const packagesToInstall = ['@kubb/core', ...selectedPlugins.map((p) => p.packageName)]

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

      const configContent = generateConfigFile(selectedPlugins, inputPath as string, outputPath as string)
      const configPath = path.join(cwd, 'kubb.config.ts')

      // Check if config already exists
      if (fs.existsSync(configPath)) {
        configSpinner.stop('kubb.config.ts already exists')

        const shouldOverwrite = await clack.confirm({
          message: 'kubb.config.ts already exists. Overwrite?',
          initialValue: false,
        })

        if (clack.isCancel(shouldOverwrite) || !shouldOverwrite) {
          clack.cancel('Keeping existing configuration. Packages have been installed.')
          process.exit(0)
        }

        configSpinner.start('Overwriting kubb.config.ts')
      }

      fs.writeFileSync(configPath, configContent, 'utf-8')

      configSpinner.stop('Created kubb.config.ts')

      // Success message
      clack.outro(
        pc.green('✓ All set!') +
          '\n\n' +
          pc.dim('Next steps:') +
          '\n' +
          pc.cyan(`  1. Make sure your OpenAPI spec is at: ${inputPath}`) +
          '\n' +
          pc.cyan('  2. Run: npx kubb generate') +
          '\n' +
          pc.cyan(`  3. Find generated files in: ${outputPath}`) +
          '\n\n' +
          pc.dim(`Using ${packageManager.name} • Kubb v${version}`),
      )
    } catch (error) {
      clack.log.error(pc.red('An error occurred during initialization'))
      if (error instanceof Error) {
        clack.log.error(error.message)
      }
      process.exit(1)
    }
  },
})

export default command

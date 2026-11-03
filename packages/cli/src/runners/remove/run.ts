import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { define } from 'gunshi'
import { BUNDLED_PACKAGES, ConfigEditOperation, extensionKinds, editConfig, editConfigFile, findConfigFile, readConfig, readImports } from '@internals/shared'
import { getErrorMessage, pascalCase, read } from '@internals/utils'
import { Diagnostics, readInstalledPackages } from '@kubb/core'
import { configArg, yesArg } from '../../commands/shared.ts'
import { isInteractiveRun, logIntro } from '../../ui/intro.ts'
import { logBlock, logError, logStep } from '../../ui/log.ts'
import { withSpinner } from '../../ui/spinner.ts'
import { createSummary } from '../../ui/summary.ts'
import { closestIds, fetchRegistryIndex, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager, uninstallPackages } from '../init/utils.ts'

export type RemoveOptions = {
  /**
   * `owner/slug`, or a bare `slug` for an official extension.
   */
  id: string
  configPath?: string
  yes: boolean
  uninstall: boolean
}

/** The lines of `before` that `after` no longer has, trimmed. */
function removedLines({ before, after }: { before: string; after: string }): Array<string> {
  const remaining = after.split('\n')
  return before
    .split('\n')
    .filter((line) => {
      const index = remaining.indexOf(line)
      if (index !== -1) remaining.splice(index, 1)
      return index === -1 && line.trim() !== ''
    })
    .map((line) => line.trim())
}

/**
 * Removes a plugin or parser from `kubb.config.ts` and uninstalls its package. Refuses the adapter,
 * which the config needs, and an extension another one in the config depends on. Previews the
 * change before asking.
 */
export async function run({ id: input, configPath, yes, uninstall }: RemoveOptions): Promise<void> {
  const cwd = process.cwd()
  const hrStart = process.hrtime()
  const summary = createSummary(hrStart)
  const fail = (title: string, lines: ReadonlyArray<string>) => {
    summary(title, 'failed', lines)
    process.exitCode = 1
  }
  logIntro({ title: isInteractiveRun({ yes }) ? undefined : styleText('bgCyan', styleText('black', ' Kubb Remove ')) })

  try {
    const id = toRegistryId(input)
    const configFile = configPath ? path.resolve(configPath) : findConfigFile(cwd)
    if (!configFile)
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: 'No kubb.config.ts found. Pass its path with --config.',
        help: 'Run `kubb remove <id> --config <path>`.',
      })
    const configName = path.relative(cwd, configFile) || configFile
    const [entries, installed, source] = await withSpinner({
      message: 'Reading the registry',
      promise: Promise.all([fetchRegistryIndex({ registry: registryUrl() }), readInstalledPackages({ root: cwd }), read(configFile)]),
    })
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const entry = entries.find((candidate) => candidate.id === id)
    if (!entry) {
      const suggestions = closestIds({ input: id, ids: entries.map((candidate) => candidate.id) }).map(toShortId)
      return fail(
        `No extension named ${input}`,
        suggestions.map((suggestion) => `  kubb remove ${suggestion}`),
      )
    }
    const { artifact, manifest } = entry
    const kind = pascalCase(manifest.kind)
    if (manifest.kind === extensionKinds.adapter)
      return fail('The adapter cannot be removed', [`  A config needs one adapter. Change it in ${configName} by hand.`])

    // Only calls that run count: a plugin Studio switched off is a comment, as in Studio's own check.
    const view = readConfig(source)
    const running = new Set(
      view.managed
        ? view.configs.flatMap((config) => [...config.plugins, ...(config.parsers ?? [])].filter((call) => !call.disabled).map((call) => call.packageName))
        : [],
    )
    const dependents = entries.filter(
      (other) => other.id !== entry.id && other.manifest.dependencies?.includes(manifest.name) && running.has(other.artifact.package),
    )
    if (dependents.length) {
      const names = dependents.map((other) => other.manifest.name).join(', ')
      return fail(`${names} ${dependents.length === 1 ? 'needs' : 'need'} ${manifest.name}`, [`  Remove ${names} first.`])
    }

    const edits = [
      {
        operation: ConfigEditOperation.REMOVE_EXTENSION,
        ...(manifest.kind === extensionKinds.parser ? { kind: extensionKinds.parser } : {}),
        plugin: artifact.package,
      },
    ]
    const preview = editConfig({ source, edits })
    const outcome = preview.outcomes[0]
    if (!outcome?.applied) return fail(`Could not edit ${configName}`, [`  ${outcome?.reason ?? 'the config file was not changed'}`])

    // Bundled extensions leave the config but stay installed.
    const bundled = BUNDLED_PACKAGES.includes(artifact.package)
    // Another `defineConfig` entry can still import it, and uninstalling it then breaks the config.
    const stillImported = readImports(preview.source).includes(artifact.package)
    const uninstalls = uninstall && !bundled && !stillImported && versions.has(artifact.package)
    if (!preview.changed && !uninstalls) {
      summary(`${manifest.name} is not in the project`, 'success', ['  No changes made'])
      return
    }

    const packageLine = (() => {
      if (uninstalls) return `Uninstalls ${artifact.package}`
      if (bundled) return `Keeps     ${artifact.package}, which ships with kubb`
      if (stillImported) return `Keeps     ${artifact.package}, which another config entry still imports`
      return 'Uninstalls nothing'
    })()
    logStep(`${kind} ${styleText('cyan', manifest.name)} v${versions.get(artifact.package) ?? artifact.version}`)
    logBlock([
      `Config    ${configName}`,
      ...removedLines({ before: source, after: preview.source }).map((line) => styleText('red', `  - ${line}`)),
      packageLine,
    ])

    const confirmed = yes || (await clack.confirm({ message: 'Remove it?', initialValue: true }))
    if (clack.isCancel(confirmed) || !confirmed) {
      summary('Remove canceled', 'canceled', [`  ${kind}  ${manifest.name}`, '  No changes made'])
      return
    }

    if (preview.changed) {
      const written = await editConfigFile({ filePath: configFile, edits })
      if (!written.outcomes[0]?.applied) return fail(`Could not edit ${configName}`, [`  ${written.outcomes[0]?.reason ?? 'the config file was not changed'}`])
      logStep(`${manifest.export}() removed from ${configName}`)
    }
    const packageManager = await detectPackageManager(cwd)
    if (uninstalls)
      await withSpinner({
        message: `Uninstalling ${artifact.package} with ${packageManager.name}`,
        promise: uninstallPackages([artifact.package], packageManager, cwd),
      })

    summary(`${kind} removed`, 'success', [
      `  Packages  ${uninstalls ? `${artifact.package} uninstalled with ${packageManager.name}` : 'none uninstalled'}`,
      '',
      'Next     kubb generate',
    ])
  } catch (error) {
    logError(getErrorMessage(error))
    fail('Remove failed', ['  See the error above'])
  }
}

export const command = define({
  name: 'remove',
  description: 'Remove a plugin or parser from kubb.config.ts and uninstall its package.',
  examples: ['kubb remove plugin-zod', 'kubb remove acme/plugin-x --yes', 'kubb remove plugin-zod --no-uninstall'].join('\n'),
  toKebab: true,
  args: {
    id: {
      type: 'positional',
      description: 'Registry id: owner/slug, or a slug for an official extension',
      required: true,
    },
    ...configArg,
    ...yesArg,
    uninstall: {
      type: 'boolean',
      description: 'Uninstall the package. Pass --no-uninstall to only edit the config',
      negatable: true,
      default: true,
    },
  },
  run: ({ values }) => run({ id: values.id, configPath: values.config, yes: values.yes, uninstall: values.uninstall }),
})

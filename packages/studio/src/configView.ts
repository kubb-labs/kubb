import { getErrorMessage } from '@internals/utils'
import { type Config, getInputKind, resolveMeta } from '@kubb/core'
import { pickOutput, readConfig } from '@internals/shared'
import type { ConfigEntryView, ConfigFileView, InstalledExtensions } from './protocol.ts'
import { toJSONOptions, toStudioName } from './resolveConfig.ts'

// Not cached: the user can edit the file between two Studio actions.
export async function readConfigFileView({
  source,
  configFile,
  warn,
}: {
  source: Promise<string>
  configFile: string
  warn: (warning: { message: string }) => Promise<void>
}): Promise<ConfigFileView | undefined> {
  try {
    return readConfig(await source)
  } catch (error) {
    await warn({ message: `Could not read ${configFile}: ${getErrorMessage(error)}` })
    return undefined
  }
}

/** The input path or URL Studio may show: no inline document, and no credentials from a URL. */
function reportedInput(input: Config['input']): string | undefined {
  if (typeof input !== 'string') return undefined
  const kind = getInputKind(input)
  if (kind === 'inline') return undefined
  // The scp-style git form (`git+git@host:org/repo.git`) is no URL and carries no password.
  if ((kind !== 'url' && kind !== 'git') || !URL.canParse(input)) return input
  const url = new URL(input)
  url.username = ''
  url.password = ''
  return url.href
}

/** A JSON copy of one resolved entry, each extension named by the package its manifest is in. */
export function toEntryView(config: Config, extensions: InstalledExtensions): ConfigEntryView {
  const input = reportedInput(config.input)
  return {
    ...(config.name !== undefined && { name: config.name }),
    ...(input !== undefined && { input }),
    output: config.output.path,
    outputOptions: toJSONOptions(pickOutput(config.output)),
    plugins: config.plugins.map((plugin) => ({
      name: toStudioName({ name: resolveMeta(plugin).name, extensions }),
      options: toJSONOptions(plugin.options),
    })),
    adapter: config.adapter && {
      name: toStudioName({ name: resolveMeta(config.adapter).name, extensions, kind: 'adapter' }),
      options: toJSONOptions(config.adapter.options),
    },
    parsers: config.parsers.map((parser) => ({
      name: toStudioName({ name: resolveMeta(parser).name, extensions, kind: 'parser' }),
      options: toJSONOptions(parser.options),
    })),
  }
}

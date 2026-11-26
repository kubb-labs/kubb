import { CONFIG_EXTENSIONS } from '@internals/shared'
import * as v from 'valibot'
import { checkConfigPath } from '../utils.ts'

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*'

/**
 * A registry id: `owner/slug`, or a bare `slug` for an official extension. The same shape the CLI
 * accepts, which also keeps a value starting with `-` from reaching the CLI as a flag.
 */
export const registryIdSchema = v.pipe(
  v.string(),
  v.regex(new RegExp(`^${SLUG}(\\/${SLUG})?$`), 'Use owner/slug, such as kubb-labs/plugin-zod, or a slug, such as plugin-zod'),
  v.description('Registry id: owner/slug, or a slug such as plugin-zod for an official extension'),
)

export const configSchema = v.optional(
  v.pipe(
    v.string(),
    v.minLength(1),
    v.description(`Path to the Kubb config inside the working directory (supports ${CONFIG_EXTENSIONS.join(', ')}). Found automatically when omitted`),
  ),
)

export const dryRunSchema = v.optional(v.pipe(v.boolean(), v.description('Preview the change without installing packages or writing files')), false)

/** The `--config` arguments for a path the AI client supplied, or the reason the path was refused. */
export async function toConfigArgs(configPath: string | undefined): Promise<{ args: Array<string> } | { error: string }> {
  if (!configPath) return { args: [] }
  const checked = await checkConfigPath(configPath)
  return 'error' in checked ? checked : { args: ['--config', checked.file] }
}

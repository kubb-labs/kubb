import { CONFIG_EXTENSIONS, REGISTRY_ID_PATTERN } from '@internals/shared'
import * as v from 'valibot'

/**
 * A registry id: `owner/slug`, or a bare `slug` for an official extension. It is the pattern the CLI
 * checks, which also keeps a value starting with `-` from reaching the CLI as a flag.
 */
export const registryIdSchema = v.pipe(
  v.string(),
  v.regex(REGISTRY_ID_PATTERN, 'Use owner/slug, such as kubb-labs/plugin-zod, or a slug, such as plugin-zod'),
  v.description('Registry id of the extension: owner/slug, such as kubb-labs/plugin-zod, or a slug such as plugin-zod for an official extension'),
)

export const configPathSchema = v.optional(
  v.pipe(
    v.string(),
    v.minLength(1),
    v.description(
      `Path to the Kubb config file inside the working directory, such as ./kubb.config.ts (supports ${CONFIG_EXTENSIONS.join(', ')}). Found automatically when omitted`,
    ),
  ),
)

export const dryRunSchema = v.optional(v.pipe(v.boolean(), v.description('Preview the change without installing packages or writing files')), false)

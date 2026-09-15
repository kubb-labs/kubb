import { styleText } from 'node:util'

/**
 * Maps each camelCase flag removed in favor of kebab-case (kubb-labs/kubb#4046) to its
 * replacement. Drop this table, and the rewrite it drives, once the deprecation window ends.
 */
const DEPRECATED_FLAGS: Record<string, string> = {
  allowWrite: 'allow-write',
  allowConfigEdit: 'allow-config-edit',
  allowInput: 'allow-input',
  allowExec: 'allow-exec',
  logLevel: 'log-level',
  dryRun: 'dry-run',
  packageVersion: 'package-version',
}

const FLAG_PATTERN = /^--([a-zA-Z][\w-]*)(=.*)?$/

/**
 * Rewrites a deprecated camelCase flag to its kebab-case replacement and warns on stderr, so a
 * script written against the old flag names keeps working during the deprecation window instead
 * of failing with an unknown-option error.
 */
export function resolveDeprecatedFlags(args: Array<string>): Array<string> {
  return args.map((arg) => {
    const match = FLAG_PATTERN.exec(arg)
    const name = match?.[1]
    const replacement = name ? DEPRECATED_FLAGS[name] : undefined

    if (!name || !replacement) {
      return arg
    }

    console.error(
      `${styleText('yellow', 'Warning:')} --${name} is deprecated, use --${replacement} instead. --${name} will be removed in a future major version.`,
    )

    return `--${replacement}${match?.[2] ?? ''}`
  })
}

import { styleText } from 'node:util'

/**
 * Maps each camelCase flag removed in favor of kebab-case (kubb-labs/kubb#4046) to its
 * replacement. Drop this table, and the rewrite it drives, once the deprecation window ends.
 */
const DEPRECATED_FLAGS: Record<string, string> = {
  allowWrite: 'allow-write',
  allowConfigEdit: 'allow-config-edit',
  allowExec: 'allow-exec',
  logLevel: 'log-level',
  dryRun: 'dry-run',
  packageVersion: 'package-version',
}

/** Flags a single command renamed, rewritten only for that command, since the old name is a common word. */
const DEPRECATED_COMMAND_FLAGS: Record<string, Record<string, string>> = {
  update: { check: 'dry-run' },
}

const FLAG_PATTERN = /^--([a-zA-Z][\w-]*)(=.*)?$/

/**
 * Rewrites a deprecated camelCase flag to its kebab-case replacement and warns on stderr, so a
 * script written against the old flag names keeps working during the deprecation window instead
 * of failing with an unknown-option error.
 */
export function resolveDeprecatedFlags(args: Array<string>): Array<string> {
  const commandFlags = DEPRECATED_COMMAND_FLAGS[args[0] ?? ''] ?? {}

  return args.map((arg) => {
    const match = FLAG_PATTERN.exec(arg)
    const name = match?.[1]
    const replacement = name ? (DEPRECATED_FLAGS[name] ?? commandFlags[name]) : undefined

    if (!name || !replacement) {
      return arg
    }

    console.error(
      `${styleText('yellow', 'Warning:')} --${name} is deprecated, use --${replacement} instead. --${name} will be removed in a future major version.`,
    )

    return `--${replacement}${match?.[2] ?? ''}`
  })
}

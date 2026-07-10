import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Config } from '@kubb/core'

/**
 * The configurable formatter names, mirrored from `Config['output'].format`. Excludes `'auto'`
 * (detection, not a tool) and `false` (skip). The `formatters`/`linters` tables below are pinned to
 * these so adding a tool to the config union without a descriptor fails to compile.
 */
type FormatterName = Exclude<NonNullable<Config['output']['format']>, 'auto' | false>
type LinterName = Exclude<NonNullable<Config['output']['lint']>, 'auto' | false>

/**
 * CLI command descriptors for each supported code formatter.
 *
 * Each entry contains the executable `command`, an `args` factory that maps an
 * output path to the correct argument list, and an `errorMessage` shown when
 * the formatter is not found.
 */
export const formatters = {
  prettier: {
    command: 'prettier',
    args: (outputPath: string) => ['--ignore-unknown', '--write', outputPath],
    errorMessage: 'Prettier not found',
  },
  biome: {
    command: 'biome',
    args: (outputPath: string) => ['format', '--write', outputPath],
    errorMessage: 'Biome not found',
  },
  oxfmt: {
    command: 'oxfmt',
    args: (outputPath: string) => [outputPath],
    errorMessage: 'Oxfmt not found',
  },
} as const satisfies Record<FormatterName, unknown>

/**
 * CLI command descriptors for each supported linter.
 *
 * Each entry contains the executable `command`, an `args` factory that maps an
 * output path to the correct argument list, and an `errorMessage` shown when
 * the linter is not found.
 */
export const linters = {
  eslint: {
    command: 'eslint',
    args: (outputPath: string) => [outputPath, '--fix'],
    errorMessage: 'Eslint not found',
  },
  biome: {
    command: 'biome',
    args: (outputPath: string) => ['lint', '--fix', outputPath],
    errorMessage: 'Biome not found',
  },
  oxlint: {
    command: 'oxlint',
    // --no-ignore so oxlint lints the folder even when it's gitignored (generated output dirs usually are).
    args: (outputPath: string) => ['--fix', '--no-ignore', outputPath],
    errorMessage: 'Oxlint not found',
  },
} as const satisfies Record<LinterName, unknown>

/**
 * Resolves to `true` when running `tool --version` exits with code 0.
 */
async function isToolAvailable(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(tool, ['--version'], { stdio: 'ignore' })

    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Returns the first installed tool from `candidates`, checked in order, or `null` when none are found.
 *
 * Availability is probed by running `<tool> --version` and checking for a zero exit code.
 *
 * @example
 * ```ts
 * const formatter = await detectTool(['oxfmt', 'biome', 'prettier'] as const)
 * const linter = await detectTool(['oxlint', 'biome', 'eslint'] as const)
 * ```
 */
export async function detectTool<TName extends string>(candidates: ReadonlyArray<TName>): Promise<TName | null> {
  for (const tool of candidates) {
    if (await isToolAvailable(tool)) {
      return tool
    }
  }

  return null
}

/**
 * Supported package manager identifiers.
 *
 * @example
 * ```ts
 * const pm: PackageManagerName = 'pnpm'
 * ```
 */
export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

/**
 * Metadata describing a package manager's lock file and install command.
 */
export interface PackageManagerInfo {
  /**
   * Identifier used in CLI commands, e.g. `pnpm`, `yarn`.
   */
  name: PackageManagerName
  /**
   * Lock file name that uniquely identifies this package manager in a project root.
   */
  lockFile: string
  /**
   * Subcommands passed to the package manager binary to install a dev dependency.
   */
  installCommand: ReadonlyArray<string>
}

/**
 * Metadata for each supported package manager, keyed by its short name.
 *
 * @example
 * ```ts
 * packageManagers.pnpm.installCommand // ['add', '-D']
 * packageManagers.npm.lockFile        // 'package-lock.json'
 * ```
 */
const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
  pnpm: {
    name: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCommand: ['add', '-D'],
  },
  yarn: {
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCommand: ['add', '-D'],
  },
  bun: {
    name: 'bun',
    lockFile: 'bun.lockb',
    installCommand: ['add', '-d'],
  },
  npm: {
    name: 'npm',
    lockFile: 'package-lock.json',
    installCommand: ['install', '--save-dev'],
  },
}

/**
 * Minimal shape of `package.json` fields read during detection.
 */
type PackageJson = {
  /**
   * The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`).
   */
  packageManager?: string
}

/**
 * Detects the active package manager for the given directory.
 * Resolution order: `packageManager` field in `package.json`, then presence of a lock file.
 * Falls back to `npm` when no signal is found.
 *
 * @example
 * ```ts
 * detectPackageManager('/my/project') // { name: 'pnpm', lockFile: 'pnpm-lock.yaml', ... }
 * detectPackageManager()              // falls back to npm when no lock file is found
 * ```
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManagerInfo {
  const packageJsonPath = join(cwd, 'package.json')
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson
      const pmField = packageJson.packageManager
      if (typeof pmField === 'string') {
        const name = pmField.split('@')[0]
        if (name && name in packageManagers) {
          return packageManagers[name as PackageManagerName]
        }
      }
    } catch {
      // Continue to lock file detection
    }
  }

  for (const pm of Object.values(packageManagers)) {
    if (existsSync(join(cwd, pm.lockFile))) {
      return pm
    }
  }

  return packageManagers.npm
}

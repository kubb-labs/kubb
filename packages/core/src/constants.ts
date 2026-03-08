import type { KubbFile } from '@kubb/fabric-core/types'

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface PackageManagerInfo {
  name: PackageManagerName
  lockFile: string
  installCommand: ReadonlyArray<string>
}

export const CORE_PLUGIN_NAME = 'core' as const

export const DEFAULT_MAX_LISTENERS = 100

export const DEFAULT_CONCURRENCY = 15

export const BARREL_FILENAME = 'index.ts' as const

export const DEFAULT_BANNER = 'simple' as const

export const DEFAULT_EXTENSION: Record<KubbFile.Extname, KubbFile.Extname | ''> = { '.ts': '.ts' }

export const PATH_SEPARATORS = ['/', '\\'] as const

export const logLevel = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

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
    args: (outputPath: string) => ['--fix', outputPath],
    errorMessage: 'Oxlint not found',
  },
} as const

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
} as const

export const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
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

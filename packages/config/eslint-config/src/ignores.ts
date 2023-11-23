export const defaultIgnores = ['dist/**', 'coverage/**', 'mocks/**', '*.d.ts', '*.config.ts', 'templates/**']

/**
 * When using in a monorepo(with a `packages` folder) we need to append `**\/`
 */
export function getMonorepoIgnores(ignores: string[]): string[] {
  return ignores.map((ignore) => `**/${ignore}`)
}

/**
 * When using in a monorepo(with a `packages` folder) we need to append `**\/`
 */
export const monorepoIgnores = getMonorepoIgnores(defaultIgnores)

export const ignores = {
  default: defaultIgnores,
  monoRepo: monorepoIgnores,
  /**
   * Combination of a ignores for a package and for a monorepo
   */
  all: [...defaultIgnores, ...monorepoIgnores],
  build: getMonorepoIgnores(['dist/**', 'coverage/**']),
}

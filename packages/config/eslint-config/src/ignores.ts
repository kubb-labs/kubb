export const defaultIgnores = ['dist/**', 'coverage/**', 'mocks/**', '*.d.ts']

/**
 * When using in a monorepo(with a `packages` folder) we need to append `**\/`
 */
export const monorepoIgnores = defaultIgnores.map((ignore) => `**/${ignore}`)

/**
 * Combination of a ignores for a package and for a monorepo
 */
export const ignores = [...defaultIgnores, ...monorepoIgnores]

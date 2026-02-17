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

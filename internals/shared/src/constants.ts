export const KUBB_CONFIG_FILENAME = 'kubb.config.ts' as const

/** File extensions a Kubb config file may use. */
export const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'] as const

export const KUBB_PACKAGE_NAME = 'kubb' as const

export const initDefaults = {
  inputPath: './openapi.yaml',
  outputPath: './src/gen',
  plugins: ['plugin-ts'],
} as const

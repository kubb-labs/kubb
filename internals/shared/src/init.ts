import { printValue, quotes } from './configFile/text.ts'

/** The `kubb.config.ts` `kubb init` writes before `kubb add` puts each plugin in. */
export function generateConfigFile({ inputPath, outputPath }: { inputPath: string; outputPath: string }): string {
  return `import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: ${printValue(inputPath, quotes.single)},
  output: {
    path: ${printValue(outputPath, quotes.single)},
    clean: true,
  },
  plugins: [],
})
`
}

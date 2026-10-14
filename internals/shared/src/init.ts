/** The `kubb.config.ts` `kubb init` writes before `kubb add` puts each plugin in. */
export function generateConfigFile({ inputPath, outputPath }: { inputPath: string; outputPath: string }): string {
  return `import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: '${inputPath}',
  output: {
    path: '${outputPath}',
    clean: true,
  },
  plugins: [],
})
`
}

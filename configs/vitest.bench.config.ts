import { defineConfig } from 'vitest/config'

const reporters: string[] = ['verbose']
const outputFile: Record<string, string> = {}

if (process.env['CI']) {
  reporters.push('json')
  outputFile['json'] = 'bench-output.json'
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    benchmark: {
      include: ['**/*.bench.ts'],
      reporters: reporters as any,
      outputFile,
    },
  },
})

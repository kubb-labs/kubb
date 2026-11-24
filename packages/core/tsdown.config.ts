import { defineConfig } from 'tsdown'
import { compileScript, parse } from 'vue/compiler-sfc'
import { packageBuilds } from '../../configs/tsdown.ts'

const vueSfc = {
  name: 'vue-sfc',
  transform(source: string, id: string) {
    if (!id.endsWith('.vue')) return

    const { descriptor, errors } = parse(source, { filename: id })
    if (errors.length) throw errors[0]

    return { code: compileScript(descriptor, { id, inlineTemplate: true }).content, moduleType: 'ts' as const }
  },
}

export default defineConfig([
  ...packageBuilds({ deps: { neverBundle: [/^@kubb\//, 'vitest'], alwaysBundle: [/@internals/], onlyBundle: false } }),
  {
    entry: { 'html/ui': 'src/reporters/html/ui.ts' },
    format: 'iife',
    dts: false,
    platform: 'browser',
    plugins: [vueSfc],
    copy: { from: 'src/reporters/html/index.html', to: 'dist/html' },
    sourcemap: false,
    minify: true,
    deps: {
      alwaysBundle: [/^vue(?:\/|$)/],
    },
  },
])

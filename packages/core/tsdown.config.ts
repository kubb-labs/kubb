import { defineConfig, type UserConfig } from 'tsdown'
import { compileScript, parse } from 'vue/compiler-sfc'

const vueSfc = {
  name: 'vue-sfc',
  transform(source: string, id: string) {
    if (!id.endsWith('.vue')) return

    const { descriptor, errors } = parse(source, { filename: id })
    if (errors.length) throw errors[0]

    return { code: compileScript(descriptor, { id, inlineTemplate: true }).content, moduleType: 'ts' as const }
  },
}

const entry = {
  index: 'src/index.ts',
  mocks: 'src/mocks.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  deps: {
    neverBundle: [/^@kubb\//, 'vitest'],
    alwaysBundle: [/@internals/],
    onlyBundle: false,
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: false,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts/.d.cts files.
    entry,
    format: ['esm', 'cjs'],
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true },
  },
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

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
}

// Entries that also ship as CommonJS. The test helpers import Vitest, which cannot be required, so they stay ESM-only.
const cjsEntry = {
  index: 'src/index.ts',
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
    // Builds the CJS JavaScript and .d.cts files. `keepNames` stays off the declaration pass: it leaks an untyped `__name` helper into .d.cts files.
    entry: cjsEntry,
    format: 'cjs',
    ...shared,
    outputOptions: (options, _format, { cjsDts }) => ({ ...options, keepNames: !cjsDts }),
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts files.
    entry,
    format: 'esm',
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
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

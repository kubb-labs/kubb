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
    // ESM: generate dts here only to avoid two competing type chunks
    entry,
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
  {
    // Built apart from the Node entries, so no shared chunk or shim adds a `node:` import to this browser-safe subpath.
    entry: { manifest: 'src/manifest.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'neutral',
    sourcemap: true,
    deps: { neverBundle: [/^@kubb\//, 'verkit'] },
    fixedExtension: false,
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

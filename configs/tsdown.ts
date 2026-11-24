import type { UserConfig } from 'tsdown'

export type Options = Partial<Record<'entry' | 'cjsEntry' | 'dtsEntry', UserConfig['entry']>> & Pick<UserConfig, 'deps'>

const dts = { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' }

/**
 * The builds every package has: the ESM JavaScript, then the CJS JavaScript with the declarations of both formats.
 * `dtsEntry` narrows `entry` to the entries that get declarations and CommonJS. `cjsEntry` narrows the CommonJS build further; its .d.cts files follow `cjsEntry`.
 * `deps` replaces the default, which keeps `@kubb/*` external and bundles `@internals/*`.
 * `keepNames` stays off the declaration passes: it leaks an untyped `__name` helper into .d.ts/.d.cts files.
 */
export function packageBuilds({
  entry = { index: 'src/index.ts' },
  dtsEntry = entry,
  cjsEntry = dtsEntry,
  deps = { neverBundle: [/^@kubb\//], alwaysBundle: [/@internals/] },
}: Options = {}): Array<UserConfig> {
  const shared: Partial<UserConfig> = { platform: 'node', sourcemap: true, shims: true, deps, fixedExtension: false }
  const esm: UserConfig = { entry, format: 'esm', dts: false, ...shared, outputOptions: { keepNames: true } }

  if (cjsEntry === dtsEntry) {
    return [
      esm,
      {
        entry: dtsEntry,
        format: ['esm', 'cjs'],
        ...shared,
        outputOptions: (options, format, { cjsDts }) => ({ ...options, keepNames: format === 'cjs' && !cjsDts }),
        dts,
      },
    ]
  }

  return [
    esm,
    { entry: cjsEntry, format: 'cjs', ...shared, outputOptions: (options, _format, { cjsDts }) => ({ ...options, keepNames: !cjsDts }), dts },
    { entry: dtsEntry, format: 'esm', ...shared, outputOptions: {}, dts },
  ]
}

import { describe, expect, it } from 'vitest'
import { assertPluginOption, normalizeOutput } from './definePlugin.ts'
import { Diagnostics } from './diagnostics.ts'

describe('normalizeOutput', () => {
  // Mode is inferred from the path extension unless set, and a group always means a directory.
  it.each<[string, { output: { path: string; mode?: 'directory' | 'file' }; group?: { type: 'tag' } }, { path: string; mode: 'directory' | 'file' }]>([
    ['a nested extensionless path', { output: { path: 'ts/models' } }, { path: 'ts/models', mode: 'directory' }],
    ['a path with an extension', { output: { path: 'models.ts' } }, { path: 'models.ts', mode: 'file' }],
    ['an explicit directory mode', { output: { path: 'types', mode: 'directory' } }, { path: 'types', mode: 'directory' }],
    ['a group with mode unset', { output: { path: 'clients' }, group: { type: 'tag' } }, { path: 'clients', mode: 'directory' }],
    [
      'a group with directory mode over a path that looks like a file',
      { output: { path: 'clients.v2', mode: 'directory' }, group: { type: 'tag' } },
      { path: 'clients.v2', mode: 'directory' },
    ],
  ])('returns %j for %s', (_name, options, expected) => {
    expect(normalizeOutput({ ...options, pluginName: 'plugin-ts' })).toStrictEqual(expected)
  })

  it.each<[string, { path: string; mode?: 'file' }]>([
    ['an explicit file mode', { path: 'models.ts', mode: 'file' }],
    ['a path that infers file mode', { path: 'clients.v2' }],
  ])('throws KUBB_INVALID_PLUGIN_OPTIONS for %s paired with a group', (_name, output) => {
    let thrown: unknown
    try {
      normalizeOutput({ output, group: { type: 'tag' }, pluginName: 'plugin-ts' })
    } catch (error) {
      thrown = error
    }

    expect(Diagnostics.isError(thrown)).toBe(true)
    expect(thrown).toMatchObject({ diagnostic: { code: 'KUBB_INVALID_PLUGIN_OPTIONS' }, message: expect.stringMatching(/output\.mode. to 'file'/) })
  })
})

describe('assertPluginOption', () => {
  it('accepts an allowed value', () => {
    expect(() => assertPluginOption({ plugin: 'plugin-ts', option: 'syntaxType', value: 'interface', allowed: ['type', 'interface'] })).not.toThrow()
  })

  it.each([
    ['bogus', '"bogus"'],
    [undefined, 'undefined'],
    [1, '1'],
    [1n, '1'],
  ])('throws KUBB_INVALID_PLUGIN_OPTIONS with the allowed values for %s', (value, shown) => {
    expect(() => assertPluginOption({ plugin: 'plugin-ts', option: 'syntaxType', value, allowed: ['type', 'interface'] })).toThrow(
      expect.objectContaining({
        diagnostic: expect.objectContaining({
          code: Diagnostics.code.invalidPluginOptions,
          severity: 'error',
          plugin: 'plugin-ts',
          message: `Plugin "plugin-ts" option \`syntaxType\` is ${shown}, but it must be one of "type", "interface".`,
        }),
      }),
    )
  })
})

import { validatePlugins } from './validate.js'

import type { KubbPlugin } from '../../types.js'

describe('PluginManager validate', () => {
  test('if validatePlugins works with 2 plugins', () => {
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginA')).toBeTruthy()
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginB')).toBeTruthy()
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginC'])).toBeTruthy()
    expect(() => validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginD'])).toThrowError()
  })
})

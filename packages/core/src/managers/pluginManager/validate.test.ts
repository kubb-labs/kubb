import { validatePlugins } from './validate'

import type { KubbPlugin } from '../../types'

describe('PluginManager validate', () => {
  test('if validatePlugins works with 2 plugins', () => {
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginA')).toBeTruthy()
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginB')).toBeTruthy()
    expect(validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginC'])).toBeTruthy()
    expect(() => validatePlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginD'])).toThrowError()
  })
})

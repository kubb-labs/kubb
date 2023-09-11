import { getDependedPlugins } from './validate.ts'

import type { KubbPlugin } from '../../types.ts'

describe('PluginManager validate', () => {
  test('if validatePlugins works with 2 plugins', () => {
    expect(getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginA')).toBeTruthy()
    expect(getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], 'pluginB')).toBeTruthy()
    expect(getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginC'])).toBeTruthy()
    try {
      getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as KubbPlugin[], ['pluginA', 'pluginD'])
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})

import { createContext } from 'react'

import type { KubbFile, Plugin, PluginManager } from '@kubb/core'
import type { KubbNode } from '../types.ts'

export type AppContextProps = {
  mode: KubbFile.Mode
  pluginManager: PluginManager
  plugin: Plugin
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

type Props = {
  mode: KubbFile.Mode
  pluginManager: PluginManager
  plugin: Plugin
  children?: KubbNode
}

export function App({ plugin, pluginManager, mode, children }: Props): KubbNode {
  return <AppContext.Provider value={{ plugin, pluginManager, mode }}>{children}</AppContext.Provider>
}

App.Context = AppContext

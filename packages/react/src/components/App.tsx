import { createContext, useContext } from 'react'

import type { Plugin, PluginManager } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { KubbNode } from '../types.ts'
import { RootContext } from './Root.tsx'

export type AppContextProps = {
  /**
   * Exit (unmount)
   */
  readonly exit: (error?: Error) => void
  readonly mode: KubbFile.Mode
  readonly pluginManager: PluginManager
  readonly plugin: Plugin
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

type Props = {
  readonly mode: KubbFile.Mode
  readonly pluginManager: PluginManager
  readonly plugin: Plugin
  readonly children?: KubbNode
}

export function App({ plugin, pluginManager, mode, children }: Props): KubbNode {
  const { exit } = useContext(RootContext)

  return <AppContext.Provider value={{ exit, plugin, pluginManager, mode }}>{children}</AppContext.Provider>
}

App.Context = AppContext

import React from 'react'

import { AppContext } from './AppContext.tsx'

type Props<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  meta: Meta
  children?: React.ReactNode
}

export function App<Meta extends Record<string, unknown> = Record<string, unknown>>({ meta, children }: Props<Meta>): React.ReactNode {
  return <AppContext.Provider value={{ meta }}>{children}</AppContext.Provider>
}

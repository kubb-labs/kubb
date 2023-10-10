import { AppContext } from './AppContext.tsx'

import type { ReactNode } from 'react'

type Props<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  meta: Meta
  children?: ReactNode
}

export function App<Meta extends Record<string, unknown> = Record<string, unknown>>({ meta, children }: Props<Meta>): ReactNode {
  return <AppContext.Provider value={{ meta }}>{children}</AppContext.Provider>
}

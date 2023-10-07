// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import React from 'react'
import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

export function App(props: Props): React.ReactNode {
  return props.children
}

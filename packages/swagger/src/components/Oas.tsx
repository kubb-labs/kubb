import { createContext } from 'react'

import { Operation } from './Operation.tsx'

import type { KubbNode } from '@kubb/react'
import type { Oas as OasType } from '../oas/index.ts'

type Props = {
  oas: OasType
  children?: KubbNode
}

type OasContextProps = {
  oas?: OasType
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ oas, children }: Props): KubbNode {
  return <OasContext.Provider value={{ oas }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation

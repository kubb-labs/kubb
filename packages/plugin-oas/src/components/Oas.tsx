import { createContext } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { OperationGenerator } from '../OperationGenerator.ts'
import { Operation } from './Operation.tsx'
import { Schema } from './Schema.tsx'

type Props = {
  /**
   * @deprecated
   */
  generator?: Omit<OperationGenerator, 'build'>
  children?: KubbNode
}

type OasContextProps = {
  /**
   * @deprecated
   */
  generator?: Omit<OperationGenerator, 'build'>
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ children, generator }: Props): KubbNode {
  return <OasContext.Provider value={{ generator }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation
Oas.Schema = Schema

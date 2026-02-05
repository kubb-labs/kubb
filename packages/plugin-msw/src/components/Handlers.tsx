import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type HandlersProps = {
  /**
   * Name of the function
   */
  name: string
  // custom
  handlers: string[]
}

export function Handlers({ name, handlers }: HandlersProps): FabricReactNode {
  return (
    <File.Source name={name} isIndexable isExportable>
      {`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const`}
    </File.Source>
  )
}

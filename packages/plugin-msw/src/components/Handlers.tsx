import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type HandlersProps = {
  /**
   * Name of the function
   */
  name: string
  // custom
  handlers: string[]
}

export function Handlers({ name, handlers }: HandlersProps): KubbReactNode {
  return (
    <File.Source name={name} isIndexable isExportable>
      {`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const`}
    </File.Source>
  )
}

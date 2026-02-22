import { camelCase } from '@kubb/core/transformers'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type Props = {
  name: string
  classNames: Array<string>
  isExportable?: boolean
  isIndexable?: boolean
}

export function WrapperClient({ name, classNames, isExportable = true, isIndexable = true }: Props): FabricReactNode {
  const properties = classNames.map((className) => `  readonly ${camelCase(className)}: ${className}`).join('\n')
  const assignments = classNames.map((className) => `    this.${camelCase(className)} = new ${className}(config)`).join('\n')

  const classCode = `export class ${name} {
${properties}

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
${assignments}
  }
}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
    </File.Source>
  )
}

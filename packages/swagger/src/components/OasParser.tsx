import transformers from '@kubb/core/transformers'
import { File, useFile } from '@kubb/react'

import { refsSorter } from '../utils/refSorter'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '@kubb/react'
import type { ImportMeta, OperationSchema } from '@kubb/swagger'
import type { SchemaGenerator } from '../SchemaGenerator'

type Props = {
  mode: KubbFile.Mode
  generator: SchemaGenerator

  name?: string
  isTypeOnly?: boolean
  items: OperationSchema[]
  // parser?: any
}

export function OasParser({ name, items, mode, generator, isTypeOnly }: Props): KubbNode {
  const file = useFile()

  const importMeta: ImportMeta[] = []
  const codes: string[] = []

  const generated = items
    .filter((operationSchema) => (name ? operationSchema.name === name : true))
    .sort(transformers.nameSorter)
    .map((operationSchema) => {
      const sources = generator.build(operationSchema)
      importMeta.push(...generator.imports)

      return {
        import: {
          refs: generator.refs,
          name: operationSchema.name,
        },
        sources,
      }
    })
    .sort(refsSorter)

  generated.forEach((item) => {
    codes.push(...item.sources)
  })

  return (
    <>
      {mode === 'directory'
        && importMeta.map((item, i) => <File.Import key={i} root={file.path} name={[item.ref.propertyName]} path={item.path} isTypeOnly={isTypeOnly} />)}
      <File.Source>
        {transformers.combineCodes(codes)}
      </File.Source>
    </>
  )
}

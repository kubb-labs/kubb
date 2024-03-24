import { File } from '@kubb/react'
import { schemaKeywords } from '@kubb/swagger'
import { useSchemaName, useSchemaObject } from '@kubb/swagger/hooks'

import type { SchemaGenerator } from '@kubb/swagger'
import type { ReactNode } from 'react'

type Props = {
  root: string
  generator: SchemaGenerator
  isTypeOnly?: boolean
}

export function SchemaImports({ root, isTypeOnly, generator }: Props): ReactNode {
  const name = useSchemaName()
  const schemaObject = useSchemaObject()

  if (!schemaObject) {
    return null
  }

  // TODO replace with React component
  const schemas = generator.buildSchemas(schemaObject, name)
  const refs = generator.deepSearch(schemas, schemaKeywords.ref)

  return (
    <>
      {refs.map((ref, i) => {
        if (!ref.args.path) {
          return undefined
        }
        return <File.Import key={i} root={root} name={[ref.args.name]} path={ref.args.path} isTypeOnly={isTypeOnly} />
      }).filter(Boolean)}
    </>
  )
}

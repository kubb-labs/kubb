import transformers from '@kubb/core/transformers'
import type { HttpMethod, Operation } from '@kubb/oas'
import type { SchemaNames } from '@kubb/plugin-oas/hooks'
import { Const, File } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'

type Props = {
  name: string
  operation: Operation
  schemas: SchemaNames
  outputSchemaName: string | undefined
}

export function Contract({ name, operation, schemas, outputSchemaName }: Props): KubbNode {
  const path = operation.path
  const method = operation.method.toUpperCase() as Uppercase<HttpMethod>

  // Build input schema
  const inputParts: string[] = []

  if (schemas.parameters.path) {
    inputParts.push(`params: ${schemas.parameters.path}`)
  }

  if (schemas.parameters.query) {
    inputParts.push(`query: ${schemas.parameters.query}`)
  }

  if (schemas.parameters.header) {
    inputParts.push(`headers: ${schemas.parameters.header}`)
  }

  if (schemas.request) {
    inputParts.push(`body: ${schemas.request}`)
  }

  // Build input schema (only if there are input parts)
  let inputSchema: string | undefined
  if (inputParts.length > 0) {
    inputSchema = `z.object({\n    ${inputParts.join(',\n    ')}\n  })`
  }

  // Build output schema (use z.void() as fallback when no response schema is defined)
  const outputSchema = outputSchemaName || 'z.void()'

  const description = operation.getDescription()
  const comments = description ? [`@description ${transformers.jsStringEscape(description)}`] : []

  const inputPart = inputSchema ? `\n  .input(${inputSchema})` : ''

  const contractCode = `base
  .route({
    path: '${path}',
    method: '${method}',
  })${inputPart}
  .output(${outputSchema})`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Const
        export
        name={name}
        JSDoc={{
          comments,
        }}
      >
        {contractCode}
      </Const>
    </File.Source>
  )
}

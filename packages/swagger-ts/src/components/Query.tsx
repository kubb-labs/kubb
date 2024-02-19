import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { useOas, useOperation, useOperationFile, useOperationName, useSchemas } from '@kubb/swagger/hooks'

import { TypeBuilder } from '../TypeBuilder.ts'

import type { KubbFile } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {
  builder: TypeBuilder
}

function printCombinedSchema(name: string, operation: Operation, schemas: OperationSchemas): string {
  const properties: Record<string, ts.TypeNode> = {
    'response': factory.createTypeReferenceNode(
      factory.createIdentifier(schemas.response.name),
      undefined,
    ),
  }

  if (schemas.request) {
    properties['request'] = factory.createTypeReferenceNode(
      factory.createIdentifier(schemas.request.name),
      undefined,
    )
  }

  if (schemas.pathParams) {
    properties['pathParams'] = factory.createTypeReferenceNode(
      factory.createIdentifier(schemas.pathParams.name),
      undefined,
    )
  }

  if (schemas.queryParams) {
    properties['queryParams'] = factory.createTypeReferenceNode(
      factory.createIdentifier(schemas.queryParams.name),
      undefined,
    )
  }

  if (schemas.headerParams) {
    properties['headerParams'] = factory.createTypeReferenceNode(
      factory.createIdentifier(schemas.headerParams.name),
      undefined,
    )
  }

  if (schemas.errors) {
    properties['errors'] = factory.createUnionDeclaration({
      nodes: schemas.errors.map(error => {
        return factory.createTypeReferenceNode(
          factory.createIdentifier(error.name),
          undefined,
        )
      }),
    })!
  }

  const namespaceNode = factory.createTypeAliasDeclaration({
    name: operation.method === 'get' ? `${name}Query` : `${name}Mutation`,
    type: factory.createTypeLiteralNode(
      Object.keys(properties).map(key => {
        const type = properties[key]
        if (!type) {
          return undefined
        }

        return factory.createPropertySignature(
          {
            name: transformers.pascalCase(key),
            type,
          },
        )
      }).filter(Boolean),
    ),
    modifiers: [factory.modifiers.export],
  })

  return print(namespaceNode)
}

export function Query({
  builder,
}: Props): ReactNode {
  const { source } = builder.build()

  return (
    <>
      {source}
    </>
  )
}

type FileProps = {
  mode: KubbFile.Mode
}

Query.File = function({ mode }: FileProps): ReactNode {
  const { options } = usePlugin<PluginOptions>()

  const schemas = useSchemas()
  const pluginManager = usePluginManager()
  const oas = useOas()
  const file = useOperationFile()
  const factoryName = useOperationName({ type: 'type' })
  const operation = useOperation()

  const builder = new TypeBuilder(options, { oas, pluginManager })
    .add(schemas.pathParams)
    .add(schemas.queryParams)
    .add(schemas.headerParams)
    .add(schemas.response)
    .add(schemas.statusCodes)

  const { source, imports } = builder.build()

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        {mode === 'directory' && imports.map((item, index) => {
          return <File.Import key={index} root={file.path} {...item} />
        })}
        <File.Source>
          {source}
          {printCombinedSchema(factoryName, operation, schemas)}
        </File.Source>
      </File>
    </Editor>
  )
}

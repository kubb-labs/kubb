/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { OasParser } from '@kubb/swagger/components'
import { useGetOperationFile, useOas, useOperation, useOperationName, useSchemas } from '@kubb/swagger/hooks'

import { TypeGenerator } from '../TypeGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {}

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

export function Schema({}: Props): ReactNode {
  return (
    <>
    </>
  )
}

type FileProps = {
  mode: KubbFile.Mode | undefined
}

Schema.File = function({ mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const oas = useOas()
  const schemas = useSchemas()
  const file = useGetOperationFile()
  const factoryName = useOperationName({ type: 'type' })
  const operation = useOperation()

  const generator = new TypeGenerator(plugin.options, { oas, plugin, pluginManager })

  const items = [
    schemas.pathParams,
    schemas.queryParams,
    schemas.headerParams,
    schemas.response,
    schemas.request,
    schemas.statusCodes,
  ].flat().filter(Boolean)

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={['z']} path="zod" />
        <OasParser
          name={undefined}
          items={items}
          mode={mode}
          generator={generator}
          isTypeOnly
        />
        <File.Source>
          {printCombinedSchema(factoryName, operation, schemas)}
        </File.Source>
      </File>
    </Editor>
  )
}

import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Parser, useApp } from '@kubb/react'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { Operation } from '@kubb/oas'
import type { ts } from '@kubb/parser-ts'
import type { OperationSchema as OperationSchemaType } from '@kubb/plugin-oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginTs } from '../types.ts'

type Props = {}

function printCombinedSchema(name: string, operation: Operation, schemas: OperationSchemas): string {
  const properties: Record<string, ts.TypeNode> = {}

  if (schemas.response) {
    properties['response'] = factory.createTypeReferenceNode(factory.createIdentifier(schemas.response.name), undefined)
  }

  if (schemas.request) {
    properties['request'] = factory.createTypeReferenceNode(factory.createIdentifier(schemas.request.name), undefined)
  }

  if (schemas.pathParams) {
    properties['pathParams'] = factory.createTypeReferenceNode(factory.createIdentifier(schemas.pathParams.name), undefined)
  }

  if (schemas.queryParams) {
    properties['queryParams'] = factory.createTypeReferenceNode(factory.createIdentifier(schemas.queryParams.name), undefined)
  }

  if (schemas.headerParams) {
    properties['headerParams'] = factory.createTypeReferenceNode(factory.createIdentifier(schemas.headerParams.name), undefined)
  }

  if (schemas.errors) {
    properties['errors'] = factory.createUnionDeclaration({
      nodes: schemas.errors.map((error) => {
        return factory.createTypeReferenceNode(factory.createIdentifier(error.name), undefined)
      }),
    })!
  }

  const namespaceNode = factory.createTypeAliasDeclaration({
    name: operation.method === 'get' ? `${name}Query` : `${name}Mutation`,
    type: factory.createTypeLiteralNode(
      Object.keys(properties)
        .map((key) => {
          const type = properties[key]
          if (!type) {
            return undefined
          }

          return factory.createPropertySignature({
            name: transformers.pascalCase(key),
            type,
          })
        })
        .filter(Boolean),
    ),
    modifiers: [factory.modifiers.export],
  })

  return print(namespaceNode)
}

export function OperationSchema({}: Props): ReactNode {
  return <></>
}

type FileProps = {}

OperationSchema.File = function ({}: FileProps): ReactNode {
  const { pluginManager, plugin, mode, fileManager } = useApp<PluginTs>()
  const oas = useOas()
  const { getSchemas, getFile, getName } = useOperationManager()
  const operation = useOperation()

  const file = getFile(operation)
  const schemas = getSchemas(operation)
  const factoryName = getName(operation, { type: 'type' })
  const generator = new SchemaGenerator(plugin.options, {
    oas,
    plugin,
    pluginManager,
    mode,
    override: plugin.options.override,
  })
  const items = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response].flat().filter(Boolean)

  const mapItem = ({ name, schema, ...options }: OperationSchemaType, i: number) => {
    const tree = generator.parse({ schema, name })
    const source = generator.getSource(name, tree, options)

    return (
      <Oas.Schema key={i} name={name} value={schema} tree={tree}>
        {mode === 'split' && <Oas.Schema.Imports isTypeOnly />}
        <File.Source>{source.join('\n')}</File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        {items.map(mapItem)}

        <File.Source>{printCombinedSchema(factoryName, operation, schemas)}</File.Source>
      </File>
    </Parser>
  )
}

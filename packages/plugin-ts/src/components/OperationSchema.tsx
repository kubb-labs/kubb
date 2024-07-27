import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Parser, useApp } from '@kubb/react'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { PluginManager } from '@kubb/core'
import type { Operation } from '@kubb/oas'
import type { ts } from '@kubb/parser-ts'
import type { OperationSchema as OperationSchemaType } from '@kubb/plugin-oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ReactNode } from 'react'
import type { FileMeta, PluginTs } from '../types.ts'
import { Schema } from './Schema.tsx'

function printCombinedSchema({
  name,
  operation,
  schemas,
  pluginManager,
}: { name: string; operation: Operation; schemas: OperationSchemas; pluginManager: PluginManager }): string {
  const properties: Record<string, ts.TypeNode> = {}

  if (schemas.response) {
    const identifier = pluginManager.resolveName({
      name: schemas.response.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['response'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.request) {
    const identifier = pluginManager.resolveName({
      name: schemas.request.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['request'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.pathParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.pathParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['pathParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.queryParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.queryParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['queryParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.headerParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.headerParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['headerParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.errors) {
    properties['errors'] = factory.createUnionDeclaration({
      nodes: schemas.errors.map((error) => {
        const identifier = pluginManager.resolveName({
          name: error.name,
          pluginKey: [pluginTsName],
          type: 'function',
        })

        return factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
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

type Props = {
  description?: string
  keysToOmit?: string[]
}

export function OperationSchema({ keysToOmit, description }: Props): ReactNode {
  return <Schema keysToOmit={keysToOmit} description={description} />
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

  const mapItem = ({ name, schema, description, keysToOmit, ...options }: OperationSchemaType, i: number) => {
    const tree = generator.parse({ schema, name })

    return (
      <Oas.Schema key={i} name={name} value={schema} tree={tree}>
        {mode === 'split' && <Oas.Schema.Imports isTypeOnly />}
        <File.Source>
          <OperationSchema description={description} keysToOmit={keysToOmit} />
        </File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        {items.map(mapItem)}

        <File.Source>{printCombinedSchema({ name: factoryName, operation, schemas, pluginManager })}</File.Source>
      </File>
    </Parser>
  )
}

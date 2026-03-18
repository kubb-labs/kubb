import { useKubb } from '@kubb/core/hooks'
import {defineGenerator} from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Type } from '../../components/v2/Type.tsx'
import type { PluginTs } from '../../types'
import { buildDataSchemaNode, buildResponseUnionSchemaNode, buildResponsesSchemaNode } from './utils.ts'
import type {SchemaNode} from "@kubb/ast/types";

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType } = options

    const { plugin, mode, getFile, resolveName } = useKubb<PluginTs>()

    const file = getFile({
      name: node.operationId,
      pluginName: plugin.name,
      extname: '.ts',
      mode,
    })

    function renderSchemaType({ node: schemaNode, name, typedName, description }: { node: SchemaNode | null; name: string; typedName: string; description?: string }) {
      if(!schemaNode) {
        return null
      }

      const imports = adapter.getImports(schemaNode, (schemaName) => ({
        name: resolveName({
          name: schemaName,
          pluginName: plugin.name,
          type: 'type',
        }),
        path: getFile({
          name: schemaName,
          pluginName: plugin.name,
          extname: '.ts',
          mode,
        }).path,
      }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />)}

          <Type
            name={name}
            typedName={typedName}
            node={schemaNode}
            description={description}
            enumType={enumType}
            enumKeyCasing={enumKeyCasing}
            optionalType={optionalType}
            arrayType={arrayType}
            syntaxType={syntaxType}
          />
        </>
      )
    }

    // Parameter types — each parameter rendered as its own type
    const paramTypes = node.parameters.map((param) => {
      const name = resolveName({
        name: `${node.operationId} ${param.name}`,
        pluginName: plugin.name,
        type: 'function',
      })
      const typedName = resolveName({
        name: `${node.operationId} ${param.name}`,
        pluginName: plugin.name,
        type: 'type',
      })

      return renderSchemaType({ node: param.schema, name, typedName })
    })

    // Response types
    const responseTypes = node.responses
      .filter((res) => res.schema)
      .map((res) => {
        const schemaNode = res.schema!
        const responseName = `${node.operationId} ${res.statusCode}`
        const resolvedName = resolveName({
          name: responseName,
          pluginName: plugin.name,
          type: 'function',
        })
        const typedName = resolveName({
          name: responseName,
          pluginName: plugin.name,
          type: 'type',
        })

        return renderSchemaType({ node: schemaNode, name: resolvedName, typedName, description: res.description })
      })

    // Request body type
    const requestType = node.requestBody
      ? (() => {
          const requestName = `${node.operationId} MutationRequest`
          const resolvedName = resolveName({
            name: requestName,
            pluginName: plugin.name,
            type: 'function',
          })
          const typedName = resolveName({
            name: requestName,
            pluginName: plugin.name,
            type: 'type',
          })

          return renderSchemaType({ node: node.requestBody, name: resolvedName, typedName, description: node.requestBody.description })
        })()
      : null

    // Combined Data type: flat aggregate of all request inputs

    const dataType = renderSchemaType({
      node: buildDataSchemaNode({ node, resolveName, pluginName: plugin.name }), name: resolveName({ name: `${node.operationId} Data`, pluginName: plugin.name, type: 'function' }), typedName: resolveName({ name: `${node.operationId} Data`, pluginName: plugin.name, type: 'type' }) })

    // Combined Responses type: status-code-keyed response map
    const responsesType = renderSchemaType({ node: buildResponsesSchemaNode({ node, resolveName, pluginName: plugin.name }), name: resolveName({ name: `${node.operationId} Responses`, pluginName: plugin.name, type: 'function' }), typedName: resolveName({ name: `${node.operationId} Responses`, pluginName: plugin.name, type: 'type' }) })

    // Combined Response type: union of all response types
    const responseType = renderSchemaType({ node: buildResponseUnionSchemaNode({ node, resolveName, pluginName: plugin.name }), name: resolveName({ name: `${node.operationId} Response`, pluginName: plugin.name, type: 'function' }), typedName:  resolveName({ name: `${node.operationId} Response`, pluginName: plugin.name, type: 'type' }) })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        {paramTypes}
        {responseTypes}
        {requestType}
        {dataType}
        {responsesType}
        {responseType}
      </File>
    )
  },
  Schema({ node, adapter, options }) {
    const { enumType, enumKeyCasing, syntaxType, optionalType, arrayType } = options
    const { plugin, mode, resolveName, getFile } = useKubb<PluginTs>()

    if (!node.name) {
      return
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveName({
        name: schemaName,
        pluginName: plugin.name,
        type: 'type',
      }),
      path: getFile({
        name: schemaName,
        pluginName: plugin.name,
        extname: '.ts',
        mode,
        // options: {
        //   group
        // },
      }).path,
    }))

    const isEnumSchema = node.type === 'enum'

    let typedName = resolveName({
      name: node.name,
      pluginName: plugin.name,
      type: 'type',
    })

    if (['asConst', 'asPascalConst'].includes(enumType) && isEnumSchema) {
      typedName = typedName += 'Key'
    }

    const type = {
      name: resolveName({
        name: node.name,
        pluginName: plugin.name,
        type: 'function',
      }),
      typedName,
      file: getFile({
        name: node.name,
        pluginName: plugin.name,
        extname: '.ts',
        mode,
        // options: {
        //   group
        // },
      }),
    } as const

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta}>
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}

        <Type
          name={type.name}
          typedName={type.typedName}
          node={node}
          enumType={enumType}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
        />
      </File>
    )
  },
})

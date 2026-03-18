import { pascalCase } from '@internals/utils'
import { applyParamsCasing } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { Type } from '../../components/v2/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../../constants.ts'
import type { PluginTs } from '../../types'
import { buildDataSchemaNode, buildResponsesSchemaNode, buildResponseUnionSchemaNode } from './utils.ts'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, mapper, group } = options
    const { mode, getFile, resolveName, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    const file = getFile({
      name: node.operationId,
      extname: '.ts',
      mode,
      options: {
        group: group ? (group.type === 'tag' ? { tag: node.tags[0] } : { path: node.path }) : undefined,
      },
    })
    const params = applyParamsCasing(node.parameters, paramsCasing)

    function renderSchemaType({
      node: schemaNode,
      name,
      typedName,
      description,
    }: {
      node: SchemaNode | null
      name: string
      typedName: string
      description?: string
    }) {
      if (!schemaNode) {
        return null
      }

      const imports = adapter.getImports(schemaNode, (schemaName) => ({
        name: resolveName({ name: schemaName, type: 'type' }),
        path: getFile({ name: schemaName, extname: '.ts', mode }).path,
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
            mapper={mapper}
          />
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolveName({ name: `${node.operationId} ${pascalCase(param.in)} ${param.name}`, type: 'function' }),
        typedName: resolveName({ name: `${node.operationId} ${pascalCase(param.in)} ${param.name}`, type: 'type' }),
      }),
    )

    const responseTypes = node.responses
      .filter((res) => res.schema)
      .map((res) =>
        renderSchemaType({
          node: res.schema!,
          name: resolveName({ name: `${node.operationId} Status ${res.statusCode}`, type: 'function' }),
          typedName: resolveName({ name: `${node.operationId} Status ${res.statusCode}`, type: 'type' }),
          description: res.description,
        }),
      )

    const requestType = node.requestBody
      ? renderSchemaType({
          node: node.requestBody,
          name: resolveName({ name: `${node.operationId} Data`, type: 'function' }),
          typedName: resolveName({ name: `${node.operationId} Data`, type: 'type' }),
          description: node.requestBody.description,
        })
      : null

    const dataType = renderSchemaType({
      node: buildDataSchemaNode({ node: { ...node, parameters: params }, resolveName }),
      name: resolveName({ name: `${node.operationId} RequestConfig`, type: 'function' }),
      typedName: resolveName({ name: `${node.operationId} RequestConfig`, type: 'type' }),
    })

    const responsesType = renderSchemaType({
      node: buildResponsesSchemaNode({ node, resolveName }),
      name: resolveName({ name: `${node.operationId} Responses`, type: 'function' }),
      typedName: resolveName({ name: `${node.operationId} Responses`, type: 'type' }),
    })

    const responseType = renderSchemaType({
      node: buildResponseUnionSchemaNode({ node, resolveName }),
      name: resolveName({ name: `${node.operationId} Response`, type: 'function' }),
      typedName: resolveName({ name: `${node.operationId} Response`, type: 'type' }),
      description: 'Union of all possible responses',
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner(node)} footer={resolveFooter(node)}>
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
    const { enumType, enumKeyCasing, syntaxType, optionalType, arrayType, mapper } = options
    const { mode, resolveName, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    if (!node.name) {
      return
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveName({ name: schemaName, type: 'type' }),
      path: getFile({ name: schemaName, extname: '.ts', mode }).path,
    }))

    const isEnumSchema = node.type === 'enum'

    let typedName = resolveName({ name: node.name, type: 'type' })
    if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema) {
      typedName += 'Key'
    }

    const type = {
      name: resolveName({ name: node.name, type: 'function' }),
      typedName,
      file: getFile({ name: node.name, extname: '.ts', mode }),
    } as const

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta} banner={resolveBanner(node)} footer={resolveFooter(node)}>
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
          mapper={mapper}
        />
      </File>
    )
  },
})

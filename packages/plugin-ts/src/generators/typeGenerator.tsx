import path from 'node:path'
import { caseParams, composeTransformers, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { builderTs } from '../builders/builderTs.ts'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import type { PluginTs } from '../types'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, resolver, transformers = [] } = options
    const { mode, config, resolveBanner, resolveFooter } = useKubb<PluginTs>()
    const root = path.resolve(config.root, config.output.path)

    const file = resolver.resolveFile({
      name: node.operationId,
      extname: '.ts',
      mode,
      options: {
        group: group ? (group.type === 'tag' ? { tag: node.tags[0] ?? 'default' } : { path: node.path }) : undefined,
      },
      root,
      output,
      group,
    })
    const params = caseParams(node.parameters, paramsCasing)

    function renderSchemaType({
      node: schemaNode,
      name,
      typedName,
      description,
      keysToOmit,
    }: {
      node: SchemaNode | null
      name: string
      typedName: string
      description?: string
      keysToOmit?: Array<string>
    }) {
      if (!schemaNode) {
        return null
      }

      const transformedNode = transform(schemaNode, composeTransformers(...transformers))

      const imports = adapter.getImports(transformedNode, (schemaName) => ({
        name: resolver.default(schemaName, 'type'),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts', mode, root, output, group }).path,
      }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />)}
          <Type
            name={name}
            typedName={typedName}
            node={transformedNode}
            description={description}
            enumType={enumType}
            enumKeyCasing={enumKeyCasing}
            optionalType={optionalType}
            arrayType={arrayType}
            syntaxType={syntaxType}
            resolver={resolver}
            keysToOmit={keysToOmit}
          />
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolver.resolveParamName(node, param),
        typedName: resolver.resolveParamTypedName(node, param),
      }),
    )

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          typedName: resolver.resolveDataTypedName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const responseTypes = node.responses.map((res) =>
      renderSchemaType({
        node: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        typedName: resolver.resolveResponseStatusTypedName(node, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
      }),
    )

    const dataType = renderSchemaType({
      node: builderTs.buildData({ node: { ...node, parameters: params }, resolver }),
      name: resolver.resolveRequestConfigName(node),
      typedName: resolver.resolveRequestConfigTypedName(node),
    })

    const responsesType = renderSchemaType({
      node: builderTs.buildResponses({ node, resolver }),
      name: resolver.resolveResponsesName(node),
      typedName: resolver.resolveResponsesTypedName(node),
    })

    const responseType = renderSchemaType({
      node: builderTs.buildResponseUnion({ node, resolver }),
      name: resolver.resolveResponseName(node),
      typedName: resolver.resolveResponseTypedName(node),
      description: 'Union of all possible responses',
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner()} footer={resolveFooter()}>
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
    const { enumType, enumKeyCasing, syntaxType, optionalType, arrayType, output, group, resolver, transformers = [] } = options
    const { mode, config, resolveBanner, resolveFooter } = useKubb<PluginTs>()
    const root = path.resolve(config.root, config.output.path)

    if (!node.name) {
      return
    }

    const transformedNode = transform(node, composeTransformers(...transformers))

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.default(schemaName, 'type'),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts', mode, root, output, group }).path,
    }))

    const isEnumSchema = !!narrowSchema(node, schemaTypes.enum)

    const typedName = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyTypedName(node) : resolver.resolveTypedName(node.name)

    const type = {
      name: resolver.resolveName(node.name),
      typedName,
      file: resolver.resolveFile({ name: node.name, extname: '.ts', mode, root, output, group }),
    } as const

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta} banner={resolveBanner()} footer={resolveFooter()}>
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={type.name}
          typedName={type.typedName}
          node={transformedNode}
          enumType={enumType}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
          resolver={resolver}
        />
      </File>
    )
  },
})

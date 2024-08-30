import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { File, Function, Type, useApp } from '@kubb/react'

import { isRequired } from '@kubb/oas'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  /**
   * TypeName of the function in PascalCase
   */
  typeName: string
  /**
   * Parameters/options/props that need to be used
   */
  params: string
  /**
   * Generics that needs to be added for TypeScript
   */
  generics?: string
  /**
   * ReturnType(see async for adding Promise type)
   */
  returnType?: string
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
  keys?: string
}

function Template({ name, typeName, params, generics, returnType, JSDoc, keys }: TemplateProps): ReactNode {
  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export generics={generics} params={params} returnType={returnType} singleLine JSDoc={JSDoc}>
          {`[${keys}] as const`}
        </Function.Arrow>
      </File.Source>

      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type name={typeName} export>
          {`ReturnType<typeof ${name}>`}
        </Type>
      </File.Source>
    </>
  )
}

type FrameworkProps = TemplateProps & {
  context: {
    factory: {
      name: string
    }
  }
}

const defaultTemplates = {
  get react() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get solid() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get svelte() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get vue() {
    return function ({ context, ...rest }: FrameworkProps): ReactNode {
      const { factory } = context

      const {
        plugin: {
          options: { pathParamsType, query },
        },
      } = useApp<PluginReactQuery>()
      const { getSchemas } = useOperationManager()
      const operation = useOperation()

      const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
      const path = new URLPath(operation.path)
      const params = new FunctionParams()
      const withQueryParams = !!schemas.queryParams?.name
      const withRequest = !!schemas.request?.name

      params.add([
        ...(pathParamsType === 'object'
          ? [
              getASTParams(schemas.pathParams, {
                typed: true,
                override: (item) => ({
                  ...item,
                  type: `MaybeRef<${item.type}>`,
                }),
              }),
            ]
          : getASTParams(schemas.pathParams, {
              typed: true,
              override: (item) => ({
                ...item,
                type: `MaybeRef<${item.type}>`,
              }),
            })),
        {
          name: 'params',
          type: `MaybeRef<${`${factory.name}["queryParams"]`}>`,
          enabled: withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: 'request',
          type: `MaybeRef<${`${factory.name}["request"]`}>`,
          enabled: withRequest,
          required: isRequired(schemas.request?.schema),
        },
      ])

      const keys = [
        path.toObject({
          type: 'path',
          stringify: true,
          replacer: (pathParam) => `unref(${pathParam})`,
        }),
        withQueryParams ? '...(params ? [params] : [])' : undefined,
        withRequest ? '...(request ? [request] : [])' : undefined,
      ].filter(Boolean)

      return <Template {...rest} params={params.toString()} keys={keys.join(', ')} />
    }
  },
} as const

type Props = {
  name: string
  typeName: string
  keysFn: (keys: unknown[]) => unknown[]
  factory: {
    name: string
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function QueryKey({ name, typeName, factory, keysFn, Template = defaultTemplates.react }: Props): ReactNode {
  const {
    plugin: {
      options: { pathParamsType },
    },
  } = useApp<PluginReactQuery>()
  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withQueryParams = !!schemas.queryParams?.name
  const withRequest = !!schemas.request?.name

  params.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams, { typed: true })] : getASTParams(schemas.pathParams, { typed: true })),
    {
      name: 'params',
      type: `${factory.name}["queryParams"]`,
      enabled: withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'data',
      type: `${factory.name}["request"]`,
      enabled: withRequest,
      required: isRequired(schemas.request?.schema),
    },
  ])

  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    withQueryParams ? '...(params ? [params] : [])' : undefined,
    withRequest ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean)

  return <Template typeName={typeName} name={name} params={params.toString()} keys={keysFn(keys).join(', ')} context={{ factory }} />
}

QueryKey.templates = defaultTemplates

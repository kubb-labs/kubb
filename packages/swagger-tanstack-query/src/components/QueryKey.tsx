import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function, Type } from '@kubb/react'
import { useOperation, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams } from '@kubb/swagger/utils'

import { pascalCase, pascalCaseTransformMerge } from 'change-case'

import type { ReactNode } from 'react'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
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

function Template({
  name,
  params,
  generics,
  returnType,
  JSDoc,
  keys,
}: TemplateProps): ReactNode {
  const typeName = pascalCase(name, { delimiter: '', transform: pascalCaseTransformMerge })

  return (
    <>
      <Function.Arrow name={name} export generics={generics} params={params} returnType={returnType} singleLine JSDoc={JSDoc}>
        {`[${keys}] as const;`}
      </Function.Arrow>

      <Type name={typeName} export>
        {`ReturnType<typeof ${name}>`}
      </Type>
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
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get solid() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get svelte() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get vue() {
    return function(
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const { factory } = context

      const schemas = useSchemas()
      const operation = useOperation()
      const path = new URLPath(operation.path)
      const params = new FunctionParams()
      const withQueryParams = !!schemas.queryParams?.name

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: (item) => ({ ...item, type: `MaybeRef<${item.type}>` }),
        }),
        {
          name: 'params',
          type: schemas.queryParams?.name ? `MaybeRef<${`${factory.name}["queryParams"]`}>` : undefined,
          enabled: !!schemas.queryParams?.name,
          required: !!schemas.queryParams?.schema.required?.length,
        },
      ])

      const keys = [
        path.toObject({
          type: 'path',
          stringify: true,
          replacer: (pathParam) => `unref(${pathParam})`,
        }),
        withQueryParams ? `...(params ? [params] : [])` : undefined,
      ].filter(Boolean)

      return <Template {...rest} params={params.toString()} keys={keys.join(', ')} />
    }
  },
} as const

type Props = {
  name: string
  factory: {
    name: string
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function QueryKey({ name, factory, Template = defaultTemplates.react }: Props): ReactNode {
  const schemas = useSchemas()
  const operation = useOperation()
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withQueryParams = !!schemas.queryParams?.name

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}["queryParams"]`,
      enabled: !!schemas.queryParams?.name,
      required: !!schemas.queryParams?.schema.required?.length,
    },
  ])

  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    withQueryParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean)

  return <Template name={name} params={params.toString()} keys={keys.join(', ')} context={{ factory }} />
}

QueryKey.templates = defaultTemplates

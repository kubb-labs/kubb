import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function, Type } from '@kubb/react'
import { useOperation, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams } from '@kubb/swagger/utils'

import { capitalCase, capitalCaseTransform } from 'change-case'

import type { ReactNode } from 'react'
import type { Framework } from '../types.ts'

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
  const typeName = capitalCase(name, { delimiter: '', transform: capitalCaseTransform })

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

type Props = {
  name: string
  factory: {
    name: string
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export const defaultTemplates = {
  get default() {
    return function({ name, factory, Template: QueryKeyTemplate = Template }: Props): ReactNode {
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
          type: 'template',
          stringify: true,
        }),
        withQueryParams ? `...(params ? [params] : [])` : undefined,
      ].filter(Boolean)

      return <QueryKeyTemplate name={name} params={params.toString()} keys={keys.join(', ')} />
    }
  },
  get react() {
    return this.default
  },
  get solid() {
    return this.default
  },
  get svelte() {
    return this.default
  },
  get vue() {
    return function({ name, factory, Template: QueryKeyTemplate = Template }: Props): ReactNode {
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
          type: 'template',
          stringify: true,
          replacer: (pathParam) => `unref(${pathParam})`,
        }),
        withQueryParams ? `...(params ? [params] : [])` : undefined,
      ].filter(Boolean)

      return <QueryKeyTemplate name={name} params={params.toString()} keys={keys.join(', ')} />
    }
  },
} as const

export function QueryKey({ framework, ...rest }: Props & { framework: Framework }): ReactNode {
  const Template = defaultTemplates[framework]

  return <Template {...rest} />
}

QueryKey.templates = defaultTemplates

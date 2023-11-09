import { File } from '@kubb/react'

import type { ReactNode } from 'react'
import type { Framework } from '../types.ts'

type TemplateProps = {
  path: string
  optionsType: string
  resultType: string
  hookName: string
}

function Template({
  path,
  hookName,
  optionsType,
  resultType,
}: TemplateProps): ReactNode {
  return (
    <>
      <File.Import name={[optionsType, resultType]} path={path} isTypeOnly />
      <File.Import name={[hookName]} path={path} />
      <File.Import name={['QueryKey']} path={path} isTypeOnly />
    </>
  )
}

type Props = {
  isV5?: boolean
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export const defaultTemplates = {
  get default() {
    return null
  },
  get react() {
    return function(
      { isV5, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <QueryImportsTemplate
          path={'@tanstack/react-query'}
          hookName={'useQuery'}
          optionsType={isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions'}
          resultType={'UseQueryResult'}
        />
      )
    }
  },
  get solid() {
    return function(
      { Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <QueryImportsTemplate
          path={'@tanstack/solid-query'}
          hookName={'createQuery'}
          optionsType={'CreateQueryOptions'}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get svelte() {
    return function(
      { Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <QueryImportsTemplate
          path={'@tanstack/svelte-query'}
          hookName={'createQuery'}
          optionsType={'CreateQueryOptions'}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get vue() {
    return function(
      { isV5 }: Props,
    ): ReactNode {
      const path = '@tanstack/vue-query'
      return (
        <>
          {isV5 && <File.Import name={['UseQueryOptions', 'UseQueryReturnType', 'QueryObserverOptions']} path={path} isTypeOnly />}

          {!isV5 && <File.Import name={['UseQueryReturnType']} path={path} isTypeOnly />}
          {!isV5 && <File.Import name={['VueQueryObserverOptions']} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />}
          <File.Import name={['useQuery']} path={path} />
          <File.Import name={['unref']} path={'vue'} />
          <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
          <File.Import name={['QueryKey']} path={path} isTypeOnly />
        </>
      )
    }
  },
} as const

export function QueryImports({ framework, ...rest }: Props & { framework: Framework }): ReactNode {
  const Template = defaultTemplates[framework]

  return <Template {...rest} />
}

QueryImports.templates = defaultTemplates

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
  isInfinite: boolean
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
      { isV5, isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      if (isInfinite) {
        return (
          <QueryImportsTemplate
            path={'@tanstack/react-query'}
            hookName={'useInfiniteQuery'}
            optionsType={'UseInfiniteQueryOptions'}
            resultType={'UseInfiniteQueryResult'}
          />
        )
      }

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
      { isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      if (isInfinite) {
        return (
          <QueryImportsTemplate
            path={'@tanstack/solid-query'}
            hookName={'createInfiniteQuery'}
            optionsType={'CreateInfiniteQueryOptions'}
            resultType={'CreateInfiniteQueryResult'}
          />
        )
      }

      return (
        <QueryImportsTemplate
          path={'@tanstack/solid-query'}
          hookName={'createQuery'}
          optionsType={'CreateBaseQueryOptions'}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get svelte() {
    return function(
      { isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      if (isInfinite) {
        return (
          <QueryImportsTemplate
            path={'@tanstack/svelte-query'}
            hookName={'createInfiniteQuery'}
            optionsType={'CreateInfiniteQueryOptions'}
            resultType={'CreateInfiniteQueryResult'}
          />
        )
      }

      return (
        <QueryImportsTemplate
          path={'@tanstack/svelte-query'}
          hookName={'createQuery'}
          optionsType={'CreateBaseQueryOptions'}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get vue() {
    return function(
      { isInfinite, isV5 }: Props,
    ): ReactNode {
      const path = '@tanstack/vue-query'

      if (isInfinite) {
        return (
          <>
            {isV5 && <File.Import name={['UseInfiniteQueryOptions', 'UseInfiniteQueryReturnType']} path={path} isTypeOnly />}

            {!isV5 && <File.Import name={['UseInfiniteQueryReturnType']} path={path} isTypeOnly />}
            {!isV5 && <File.Import name={['VueInfiniteQueryObserverOptions']} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />}
            <File.Import name={['useInfiniteQuery']} path={path} />
            <File.Import name={['unref']} path={'vue'} />
            <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
            <File.Import name={['QueryKey']} path={path} isTypeOnly />
          </>
        )
      }

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

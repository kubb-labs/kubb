import { PackageManager } from '@kubb/core'
import { File } from '@kubb/react'

import { getImportNames } from '../utils.ts'

import type { ReactNode } from 'react'

type TemplateProps = {
  /**
   * Path to @tanstack-query
   */
  path: string
  /**
   * Override the path of 'useQuery'
   * @default 'path'
   */
  hookPath: string | undefined
  optionsType: string
  queryOptions: string | undefined
  resultType: string
  hookName: string
  isInfinite: boolean
}

function Template({ path, hookPath = path, isInfinite, hookName, queryOptions, optionsType, resultType }: TemplateProps): ReactNode {
  return (
    <>
      <File.Import name={[optionsType, resultType]} path={path} isTypeOnly />
      <File.Import name={[hookName]} path={hookPath} />

      {queryOptions && <File.Import name={[queryOptions].filter(Boolean)} path={path} />}
      <File.Import name={['QueryKey', 'WithRequired', isInfinite ? 'InfiniteData' : undefined].filter(Boolean)} path={path} isTypeOnly />
    </>
  )
}

type FrameworkProps = Partial<TemplateProps> & {
  context: {
    isInfinite: boolean
    isSuspense: boolean
  }
}

const defaultTemplates = {
  get react() {
    return function ({ context, hookPath, ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack\/react-query/, '>=5')
      const { isInfinite, isSuspense } = context

      return (
        <Template
          isInfinite={isInfinite}
          {...(isSuspense ? importNames.querySuspense.react : isInfinite ? importNames.queryInfinite.react : importNames.query.react)}
          queryOptions={isV5 ? (isInfinite ? 'infiniteQueryOptions' : 'queryOptions') : undefined}
          hookPath={hookPath}
          {...rest}
        />
      )
    }
  },
  get solid() {
    return function ({ context, hookPath, ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack\/react-query/, '>=5')
      const { isInfinite } = context

      return (
        <Template
          isInfinite={isInfinite}
          {...(isInfinite ? importNames.queryInfinite.solid : importNames.query.solid)}
          queryOptions={isV5 ? (isInfinite ? 'infiniteQueryOptions' : 'queryOptions') : undefined}
          hookPath={hookPath}
          {...rest}
        />
      )
    }
  },
  get svelte() {
    return function ({ context, hookPath, ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack\/react-query/, '>=5')
      const { isInfinite } = context

      return (
        <Template
          isInfinite={isInfinite}
          {...(isInfinite ? importNames.queryInfinite.svelte : importNames.query.svelte)}
          queryOptions={isV5 ? (isInfinite ? 'infiniteQueryOptions' : 'queryOptions') : undefined}
          hookPath={hookPath}
          {...rest}
        />
      )
    }
  },
  get vue() {
    return function ({ context, hookPath, ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack\/react-query/, '>=5')
      const { isInfinite } = context
      const path = '@tanstack/vue-query'

      return (
        <>
          {isV5 && (
            <>
              <Template
                isInfinite={isInfinite}
                {...(isInfinite ? importNames.queryInfinite.vue : importNames.query.vue)}
                queryOptions={isInfinite ? 'infiniteQueryOptions' : 'queryOptions'}
                hookPath={hookPath}
                {...rest}
              />
              <File.Import name={['QueryObserverOptions']} path={path} isTypeOnly />
            </>
          )}

          {!isV5 && isInfinite && (
            <>
              <File.Import name={[importNames.queryInfinite.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[importNames.queryInfinite.vue.optionsType]} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />
              <File.Import name={[importNames.queryInfinite.vue.hookName]} path={path} />
            </>
          )}

          {!isV5 && !isInfinite && (
            <>
              <File.Import name={[importNames.query.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[importNames.query.vue.optionsType]} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />
              <File.Import name={[importNames.query.vue.hookName]} path={path} />
            </>
          )}
          <File.Import name={['unref']} path={'vue'} />
          <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
          <File.Import name={['QueryKey', 'WithRequired']} path={path} isTypeOnly />
        </>
      )
    }
  },
} as const

type Props = {
  hookPath: string | undefined
  isInfinite: boolean
  /**
   * Only for React and v5
   */
  isSuspense: boolean
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function QueryImports({ hookPath, isInfinite, isSuspense, Template = defaultTemplates.react }: Props): ReactNode {
  return (
    <Template
      hookPath={hookPath}
      context={{
        isInfinite,
        isSuspense,
      }}
    />
  )
}

QueryImports.templates = defaultTemplates

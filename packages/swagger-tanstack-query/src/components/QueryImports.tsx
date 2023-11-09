import { File } from '@kubb/react'

import { getImports } from '../utils.ts'

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
      const imports = getImports({ isV5 })

      return (
        <QueryImportsTemplate
          {...isInfinite ? imports.queryInfinite.react : imports.query.react}
        />
      )
    }
  },
  get solid() {
    return function(
      { isV5, isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })

      return (
        <QueryImportsTemplate
          {...isInfinite ? imports.queryInfinite.solid : imports.query.solid}
        />
      )
    }
  },
  get svelte() {
    return function(
      { isV5, isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })

      return (
        <QueryImportsTemplate
          {...isInfinite ? imports.queryInfinite.svelte : imports.query.svelte}
        />
      )
    }
  },
  get vue() {
    return function(
      { isV5, isInfinite, Template: QueryImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })
      const path = '@tanstack/vue-query'

      return (
        <>
          {isV5
            && (
              <>
                <QueryImportsTemplate
                  {...isInfinite ? imports.queryInfinite.vue : imports.query.vue}
                />
                <File.Import name={['QueryObserverOptions']} path={path} isTypeOnly />
              </>
            )}

          {!isV5 && isInfinite && (
            <>
              <File.Import name={[imports.queryInfinite.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[imports.queryInfinite.vue.optionsType]} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />
              <File.Import name={[imports.queryInfinite.vue.hookName]} path={path} />
            </>
          )}

          {!isV5 && !isInfinite && (
            <>
              <File.Import name={[imports.query.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[imports.query.vue.optionsType]} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />
              <File.Import name={[imports.query.vue.hookName]} path={path} />
            </>
          )}
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

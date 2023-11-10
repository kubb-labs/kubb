import { PackageManager } from '@kubb/core'
import { File } from '@kubb/react'

import { getImportNames } from '../utils.ts'

import type { ReactNode } from 'react'

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

type FrameworkProps = Partial<TemplateProps> & {
  context: {
    isInfinite: boolean
  }
}

const defaultTemplates = {
  get react() {
    return function(
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const importNames = getImportNames()
      const { isInfinite } = context

      return (
        <Template
          {...isInfinite ? importNames.queryInfinite.react : importNames.query.react}
          {...rest}
        />
      )
    }
  },
  get solid() {
    return function(
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const importNames = getImportNames()
      const { isInfinite } = context

      return (
        <Template
          {...isInfinite ? importNames.queryInfinite.solid : importNames.query.solid}
          {...rest}
        />
      )
    }
  },
  get svelte() {
    return function(
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const importNames = getImportNames()
      const { isInfinite } = context

      return (
        <Template
          {...isInfinite ? importNames.queryInfinite.svelte : importNames.query.svelte}
          {...rest}
        />
      )
    }
  },
  get vue() {
    return function(
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
      const { isInfinite } = context
      const path = '@tanstack/vue-query'

      return (
        <>
          {isV5
            && (
              <>
                <Template
                  {...isInfinite ? importNames.queryInfinite.vue : importNames.query.vue}
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
          <File.Import name={['QueryKey']} path={path} isTypeOnly />
        </>
      )
    }
  },
} as const

type Props = {
  isInfinite: boolean
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function QueryImports({ isInfinite, Template = defaultTemplates.react }: Props): ReactNode {
  return (
    <Template
      context={{
        isInfinite,
      }}
    />
  )
}

QueryImports.templates = defaultTemplates

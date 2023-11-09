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
      { isV5, Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })

      return (
        <MutationImportsTemplate
          {...imports.mutation.react}
        />
      )
    }
  },
  get solid() {
    return function(
      { isV5, Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })

      return (
        <MutationImportsTemplate
          {...imports.mutation.solid}
        />
      )
    }
  },
  get svelte() {
    return function(
      { isV5, Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })

      return (
        <MutationImportsTemplate
          {...imports.mutation.svelte}
        />
      )
    }
  },
  get vue() {
    return function(
      { isV5, Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      const imports = getImports({ isV5 })
      const path = '@tanstack/vue-query'

      return (
        <>
          {isV5
            && (
              <MutationImportsTemplate
                {...imports.mutation.vue}
              />
            )}

          {!isV5 && (
            <>
              <File.Import name={[imports.mutation.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[imports.mutation.vue.optionsType]} path={'@tanstack/vue-query/build/lib/useMutation'} isTypeOnly />
              <File.Import name={[imports.mutation.vue.hookName]} path={path} />
            </>
          )}
          <File.Import name={['unref']} path={'vue'} />
          <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
        </>
      )
    }
  },
} as const

export function MutationImports({ framework, ...rest }: Props & { framework: Framework }): ReactNode {
  const Template = defaultTemplates[framework]

  return <Template {...rest} />
}

MutationImports.templates = defaultTemplates

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
      { Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <MutationImportsTemplate
          path={'@tanstack/react-query'}
          hookName={'useMutation'}
          optionsType={'UseMutationOptions'}
          resultType={'UseMutationResult'}
        />
      )
    }
  },
  get solid() {
    return function(
      { Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <MutationImportsTemplate
          path={'@tanstack/solid-query'}
          hookName={'createMutation'}
          optionsType={'CreateMutationOptions'}
          resultType={'CreateMutationResult'}
        />
      )
    }
  },
  get svelte() {
    return function(
      { Template: MutationImportsTemplate = Template }: Props,
    ): ReactNode {
      return (
        <MutationImportsTemplate
          path={'@tanstack/svelte-query'}
          hookName={'createMutation'}
          optionsType={'CreateMutationOptions'}
          resultType={'CreateMutationResult'}
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
          {isV5 && <File.Import name={['UseMutationOptions', 'UseMutationReturnType']} path={path} isTypeOnly />}

          {!isV5 && <File.Import name={['UseMutationReturnType']} path={path} isTypeOnly />}
          {!isV5 && <File.Import name={['VueMutationObserverOptions']} path={'@tanstack/vue-query/build/lib/useMutation'} isTypeOnly />}
          <File.Import name={['useMutation']} path={path} />
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

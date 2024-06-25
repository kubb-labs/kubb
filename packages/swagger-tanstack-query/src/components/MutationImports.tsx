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

function Template({ path, hookName, optionsType, resultType }: TemplateProps): ReactNode {
  return (
    <>
      <File.Import name={[optionsType, resultType]} path={path} isTypeOnly />
      <File.Import name={[hookName]} path={path} />
    </>
  )
}

type FrameworkProps = Partial<TemplateProps>

const defaultTemplates = {
  get react() {
    return function ({ ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()

      return <Template {...importNames.mutation.react} {...rest} />
    }
  },
  get solid() {
    return function ({ ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()

      return <Template {...importNames.mutation.solid} {...rest} />
    }
  },
  get svelte() {
    return function ({ ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()

      return <Template {...importNames.mutation.svelte} {...rest} />
    }
  },
  get vue() {
    return function ({ ...rest }: FrameworkProps): ReactNode {
      const importNames = getImportNames()
      const isV5 = new PackageManager().isValidSync(/@tanstack\/react-query/, '>=5')
      const path = '@tanstack/vue-query'

      return (
        <>
          {isV5 && <Template {...importNames.mutation.vue} {...rest} />}

          {!isV5 && (
            <>
              <File.Import name={[importNames.mutation.vue.resultType]} path={path} isTypeOnly />
              <File.Import name={[importNames.mutation.vue.optionsType]} path={'@tanstack/vue-query/build/lib/useMutation'} isTypeOnly />
              <File.Import name={[importNames.mutation.vue.hookName]} path={path} />
            </>
          )}
          <File.Import name={['unref']} path={'vue'} />
          <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
        </>
      )
    }
  },
} as const

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function MutationImports({ Template = defaultTemplates.react }: Props): ReactNode {
  return <Template />
}

MutationImports.templates = defaultTemplates

import { File, Type, usePlugin } from '@kubb/react'
import { useFile } from '@kubb/react'
import { useOas } from '@kubb/swagger/hooks'

import type { OasTypes } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  api: OasTypes.OASDocument
}

function Template({
  name,
  typeName,
  api,
}: TemplateProps): ReactNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(api, undefined, 2)} as const`}
      <br />
      <Type name={typeName} export>
        {`Infer<typeof ${name}>`}
      </Type>
    </>
  )
}

const defaultTemplates = { default: Template } as const

type Props = {
  name: string
  typeName: string
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Oas({
  name,
  typeName,
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const oas = useOas()

  return <Template name={name} typeName={typeName} api={oas.api} />
}

type FileProps = {
  name: string
  typeName: string
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Oas.File = function({ name, typeName, templates = defaultTemplates }: FileProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name, pluginKey })

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      <File.Import name={['Infer']} path="@kubb/swagger-ts/oas" isTypeOnly />
      <File.Source>
        <Oas Template={Template} name={name} typeName={typeName} />
      </File.Source>
    </File>
  )
}

Oas.templates = defaultTemplates

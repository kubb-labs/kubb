import { Editor, File, Type, usePlugin } from '@kubb/react'
import { useGetFile } from '@kubb/react'
import { useOas } from '@kubb/swagger/hooks'

import type { OasTypes } from '@kubb/swagger/oas'
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

function Template({ name, typeName, api }: TemplateProps): ReactNode {
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

export function OasType({ name, typeName, Template = defaultTemplates.default }: Props): ReactNode {
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

OasType.File = function ({ name, typeName, templates = defaultTemplates }: FileProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useGetFile({ name, extName: '.ts', pluginKey })

  const Template = templates.default

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['Infer']} path="@kubb/swagger-ts/oas" isTypeOnly />
        <File.Source>
          <OasType Template={Template} name={name} typeName={typeName} />
        </File.Source>
      </File>
    </Editor>
  )
}

OasType.templates = defaultTemplates

import { File, Type, useApp } from '@kubb/react'
import { useOas } from '@kubb/plugin-oas/hooks'

import type { OasTypes } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginTs } from '../types.ts'

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
      <File.Source name={name} isExportable>
        {`export const ${name} = ${JSON.stringify(api, undefined, 2)} as const`}
      </File.Source>
      <br />
      <File.Source name={typeName} isExportable isTypeOnly>
        <Type name={typeName} export>
          {`Infer<typeof ${name}>`}
        </Type>
      </File.Source>
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
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginTs>()
  const file = pluginManager.getFile({ name, extName: '.ts', pluginKey })

  const Template = templates.default

  return (
    <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
      <File.Import name={['Infer']} path="@kubb/oas" isTypeOnly />
      <OasType Template={Template} name={name} typeName={typeName} />
    </File>
  )
}

OasType.templates = defaultTemplates

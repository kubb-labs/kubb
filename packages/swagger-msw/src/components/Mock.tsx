import { PackageManager } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import { File, usePlugin } from '@kubb/react'
import { useOperation, useResolve, useResolveName, useSchemas } from '@kubb/swagger/hooks'
import { pluginKey as fakerPluginKey } from '@kubb/swagger-faker'
import { useResolve as useResolveFaker } from '@kubb/swagger-faker/hooks'

import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  /**
   * If false, MSW 1.x.x
   * If true, MSW 2.x.x
   */
  isV2: boolean
  /**
   * Method of the current operation, see useOperation.
   */
  method: HttpMethod
  /**
   * Path of the mock
   */
  path: URLPath
  /**
   * Name of the import for the mock(this is a function).
   * @example createPet
   */
  responseName: string
}

function Template({
  name,
  method,
  path,
  isV2,
  responseName,
}: TemplateProps): ReactNode {
  if (isV2) {
    return (
      <>
        {`
  export const ${name} = http.${method}('*${path.toURLPath()}', function handler(info) {
    return new Response(JSON.stringify(${responseName}()), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  `}
      </>
    )
  }

  return (
    <>
      {`
export const ${name} = rest.${method}('*${path.toURLPath()}', function handler(req, res, ctx) {
  return res(
    ctx.json(${responseName}()),
  )
})
`}
    </>
  )
}

const defaultTemplates = { default: Template } as const

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Mock({
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const { name } = useResolve({ pluginKey, type: 'function' })
  const responseName = useResolveName({ pluginKey: fakerPluginKey, name: schemas.response.name, type: 'type' })
  const operation = useOperation()

  const isV2 = new PackageManager().isValidSync('msw', '>=2')

  return <Template isV2={isV2} name={name} responseName={responseName} method={operation.method} path={new URLPath(operation.path)} />
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Mock.File = function({ templates = defaultTemplates }: FileProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const faker = useResolveFaker({ type: 'file' })
  const responseName = useResolveName({ pluginKey: fakerPluginKey, name: schemas.response.name, type: 'type' })

  const isV2 = new PackageManager().isValidSync('msw', '>=2')

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
        // needed for the `output.groupBy`
        tag: operation?.getTags()[0]?.name,
      }}
    >
      {!isV2 && <File.Import name={['rest']} path={'msw'} />}
      {isV2 && <File.Import name={['http']} path={'msw'} />}
      {faker && responseName && <File.Import name={[responseName]} root={file.path} path={faker.path} />}
      <File.Source>
        <Mock Template={Template} />
      </File.Source>
    </File>
  )
}

Mock.templates = defaultTemplates

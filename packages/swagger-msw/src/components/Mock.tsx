import { PackageManager } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import { Editor, File, useResolveName } from '@kubb/react'
import { useGetOperationFile, useOperation, useOperationName, useOperationSchemas } from '@kubb/swagger/hooks'
import { pluginKey as fakerPluginKey } from '@kubb/swagger-faker'

import type { HttpMethod } from '@kubb/swagger/oas'
import type { ReactNode } from 'react'
import type { FileMeta } from '../types.ts'

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
  const schemas = useOperationSchemas()
  const name = useOperationName({ type: 'function' })
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
  const schemas = useOperationSchemas()
  const file = useGetOperationFile()
  const fileFaker = useGetOperationFile({ pluginKey: fakerPluginKey })
  const responseName = useResolveName({ pluginKey: fakerPluginKey, name: schemas.response.name, type: 'function' })

  const isV2 = new PackageManager().isValidSync('msw', '>=2')

  const Template = templates.default

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        {!isV2 && <File.Import name={['rest']} path={'msw'} />}
        {isV2 && <File.Import name={['http']} path={'msw'} />}
        {fileFaker && responseName && <File.Import name={[responseName]} root={file.path} path={fileFaker.path} />}
        <File.Source>
          <Mock Template={Template} />
        </File.Source>
      </File>
    </Editor>
  )
}

Mock.templates = defaultTemplates

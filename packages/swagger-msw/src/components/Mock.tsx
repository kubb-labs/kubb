import { PackageManager } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import { File, usePlugin } from '@kubb/react'
import { useOperation, useResolve, useResolveName, useSchemas } from '@kubb/swagger/hooks'
import { pluginKey as fakerPluginKey } from '@kubb/swagger-faker'
import { useResolve as useResolveFaker } from '@kubb/swagger-faker/hooks'

import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type MockTemplateProps = {
  name: string
  isV2: boolean
  // props Mock
  method: HttpMethod
  path: URLPath
  responseName: string
}

Mock.Template = function({
  name,
  method,
  path,
  isV2,
  responseName,
}: MockTemplateProps): ReactNode {
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

type MockProps = {
  /**
   * Will make it possible to override the default behaviour of Mock.Template
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Mock.Template>>
}

Mock.File = function({ Template = Mock.Template }: MockProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const file = useResolve({ pluginKey, type: 'file' })
  const faker = useResolveFaker({ type: 'file' })
  const responseName = useResolveName({ pluginKey: fakerPluginKey, name: schemas.response.name, type: 'type' })

  const isV2 = new PackageManager().isValidSync('msw', '>=2')

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
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

export function Mock({
  Template = Mock.Template,
}: MockProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const { name } = useResolve({ pluginKey, type: 'function' })
  const responseName = useResolveName({ pluginKey: fakerPluginKey, name: schemas.response.name, type: 'type' })
  const operation = useOperation()

  const isV2 = new PackageManager().isValidSync('msw', '>=2')

  return <Template isV2={isV2} name={name} responseName={responseName} method={operation.method} path={new URLPath(operation.path)} />
}

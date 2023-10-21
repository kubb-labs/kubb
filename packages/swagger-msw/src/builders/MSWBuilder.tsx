import { getRelativePath, URLPath } from '@kubb/core'
import { createRoot, File } from '@kubb/react'
import { OasBuilder, useResolve, useResolveName } from '@kubb/swagger'
import { useResolve as useResolveFaker } from '@kubb/swagger-faker'

import { pluginName } from '../plugin.ts'

import type { AppContextProps, RootType } from '@kubb/react'
import type { AppMeta } from '../types.ts'

type Options = {
  responseName?: string
}

type MSWResult = { Component: React.ElementType }

export class MSWBuilder extends OasBuilder<Options> {
  get mock(): MSWResult {
    const { responseName } = this.options
    const { operation } = this.context

    const Component = () => {
      const name = useResolveName({ pluginName, type: 'function' })

      return (
        <>
          {`
    export const ${name} = rest.${operation.method}('*${URLPath.toURLPath(operation.path)}', function handler(req, res, ctx) {
      return res(
        ctx.json(${responseName}()),
      );
    });
    `}
        </>
      )
    }

    return { Component }
  }

  print(): string {
    return this.render().output
  }

  render(): RootType<AppContextProps<AppMeta>> {
    const { responseName } = this.options
    const { operation, pluginManager, schemas } = this.context

    const { Component: Mock } = this.mock

    const root = createRoot<AppContextProps<AppMeta>>()

    const Component = () => {
      const file = useResolve({ pluginName, type: 'file' })
      const faker = useResolveFaker({ type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Import name={['rest']} path={'msw'} />

          {faker && responseName && <File.Import name={[responseName]} path={getRelativePath(file.path, faker.path)} />}
          <File.Source>
            <Mock />
          </File.Source>
        </File>
      )
    }

    root.render(<Component />, { meta: { pluginManager, schemas, operation } })

    return root
  }
}

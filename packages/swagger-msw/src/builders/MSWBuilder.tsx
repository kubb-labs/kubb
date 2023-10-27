import { PackageManager } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import { createRoot } from '@kubb/react'
import { File } from '@kubb/react'
import { OasBuilder } from '@kubb/swagger'
import { useResolve, useResolveName } from '@kubb/swagger/hooks'
import { useResolve as useResolveFaker } from '@kubb/swagger-faker/hooks'

import type { AppContextProps, RootType } from '@kubb/react'
import type { AppMeta } from '../types.ts'

type Options = {
  responseName?: string
}

type MSWResult = { Component: React.ElementType }

export class MSWBuilder extends OasBuilder<Options> {
  get mock(): MSWResult {
    const { responseName } = this.options
    const { operation, plugin } = this.context

    const isV2 = new PackageManager().isValidSync('msw', '>=2')

    const Component = () => {
      const name = useResolveName({ pluginKey: plugin.key, type: 'function' })

      if (isV2) {
        return (
          <>
            {`
      export const ${name} = http.${operation.method}('*${new URLPath(operation.path).toURLPath()}', function handler(info) {
        return new Response(JSON.stringify(${responseName}()), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });
      `}
          </>
        )
      }

      return (
        <>
          {`
    export const ${name} = rest.${operation.method}('*${new URLPath(operation.path).toURLPath()}', function handler(req, res, ctx) {
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
    const { operation, pluginManager, schemas, plugin } = this.context

    const { Component: Mock } = this.mock

    const root = createRoot<AppContextProps<AppMeta>>()

    const isV2 = new PackageManager().isValidSync('msw', '>=2')

    const Component = () => {
      const file = useResolve({ pluginKey: plugin.key, type: 'file' })
      const faker = useResolveFaker({ type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          {!isV2 && <File.Import name={['rest']} path={'msw'} />}
          {isV2 && <File.Import name={['http']} path={'msw'} />}

          {faker && responseName && <File.Import name={[responseName]} root={file.path} path={faker.path} />}
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

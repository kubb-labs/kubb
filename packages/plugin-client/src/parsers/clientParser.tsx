import { URLPath } from '@kubb/core/utils'
import { File } from '@kubb/react'
import { pluginTsName } from '@kubb/plugin-ts'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'

import { isOptional } from '@kubb/oas'
import type { PluginClient } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Client } from '../components/Client.tsx'

// TOOD move to ts plugin
const typeParser = createParser({
  name: 'types',
  pluginName: pluginTsName,
})

export const clientParser = createParser<PluginClient>({
  name: 'client',
  pluginName: 'plugin-client',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const contentType = operation.getContentType()
      const name = getName({ type: 'function' })
      const schemas = getSchemas({ parser: typeParser })
      const file = getFile()
      const fileType = getFile({ parser: typeParser })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          <File.Import name={'client'} path={options.client.importPath} />
          <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
          <File.Import
            extName={options.extName}
            name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
              Boolean,
            )}
            root={file.path}
            path={fileType.path}
            isTypeOnly
          />
          <File.Source>
            <Client
              name={name}
              params={{
                pathParams: {
                  mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
                  children: getPathParams(schemas.pathParams, { typed: true }),
                },
                data: schemas.request?.name
                  ? {
                      type: schemas.request?.name,
                      optional: isOptional(schemas.request?.schema),
                    }
                  : undefined,
                params: schemas.queryParams?.name
                  ? {
                      type: schemas.queryParams?.name,
                      optional: isOptional(schemas.queryParams?.schema),
                    }
                  : undefined,
                headers: schemas.headerParams?.name
                  ? {
                      type: schemas.headerParams?.name,
                      optional: isOptional(schemas.headerParams?.schema),
                    }
                  : undefined,
                options: {
                  type: 'Partial<Parameters<typeof client>[0]>',
                  default: '{}',
                },
              }}
              returnType={options.dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
              JSDoc={{
                comments: getComments(operation),
              }}
              client={{
                // only set baseURL from serverIndex(swagger) when no custom client(default) is used
                baseURL: options.client.importPath === '@kubb/plugin-client/client' ? options.baseURL : undefined,
                generics: [schemas.response.name, schemas.request?.name].filter(Boolean),
                dataReturnType: options.dataReturnType,
                withQueryParams: !!schemas.queryParams?.name,
                withData: !!schemas.request?.name,
                withHeaders: !!schemas.headerParams?.name,
                method: operation.method,
                path: new URLPath(operation.path),
                contentType,
              }}
            />
          </File.Source>
        </File>
      )
    },
  },
})

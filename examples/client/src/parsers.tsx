import { File, Function } from '@kubb/react'
import { isOptional } from '@kubb/oas'
import { type PluginClient, pluginClientName } from '@kubb/plugin-client'
import React from 'react'
import { createParser } from '@kubb/plugin-oas'
import { URLPath } from '@kubb/core/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'

// TOOD move to ts plugin
const typeParser = createParser({
  name: 'types',
  pluginName: pluginTsName,
})

const axiosParser = createParser<PluginClient>({
  name: 'axios',
  pluginName: pluginClientName,
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const file = getFile()
      const fileType = getFile({ parser: typeParser })
      const schemas = getSchemas({ parser: typeParser })
      const name = getName({ type: 'function' })

      const clientParams = [new URLPath(operation.path).toTemplateString(), schemas.request?.name ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

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
          <File.Import name="axios" path="axios" />
          <Function
            name={name}
            async
            export
            returnType={options.dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
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
            JSDoc={{
              comments: getComments(operation),
            }}
          >
            {`return axios.${operation.method}(${clientParams})`}
          </Function>
        </File>
      )
    },
  },
})

export const parsers = [axiosParser]

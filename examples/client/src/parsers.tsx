import { File, Function } from '@kubb/react'
import { isOptional } from '@kubb/oas'
import type { PluginClient } from '@kubb/plugin-client'
import React from 'react'
import { createParser } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { URLPath } from '@kubb/core/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { useApp } from '@kubb/react'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { FileMeta } from '@kubb/plugin-client/src/types.ts'

const axiosParser = createParser<PluginClient>({
  name: 'axios',
  templates: {
    Operation({ operation }) {
      const {
        plugin: {
          options: {
            client: { importPath },
            dataReturnType,
            pathParamsType,
            extName,
          },
        },
      } = useApp<PluginClient>()
      const { getSchemas, getFile, getName } = useOperationManager()

      const file = getFile(operation)
      const fileType = getFile(operation, { pluginKey: [pluginTsName] })
      const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
      const name = getName(operation, { type: 'function' })

      const clientParams = [new URLPath(operation.path).toTemplateString(), schemas.request?.name ? 'data' : undefined, 'options'].filter(Boolean).join(', ')


      return (
        <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
          <File.Import name={'client'} path={importPath} />
          <File.Import name={['ResponseConfig']} path={importPath} isTypeOnly />
          <File.Import
            extName={extName}
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
            returnType={dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
            params={{
              pathParams: {
                mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
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

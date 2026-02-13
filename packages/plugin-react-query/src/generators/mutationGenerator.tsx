import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { difference } from 'remeda'
import { Mutation, MutationKey } from '../components'
import { MutationOptions } from '../components/MutationOptions.tsx'
import type { PluginReactQuery } from '../types'

function withRequiredRequestBodySchema(typeSchemas: OperationSchemas): OperationSchemas {
  const requestBody = typeSchemas.request?.operation?.schema?.requestBody

  if (!typeSchemas.request || !requestBody || '$ref' in requestBody || requestBody.required !== true) {
    return typeSchemas
  }

  if (Array.isArray(typeSchemas.request.schema.required) && typeSchemas.request.schema.required.length > 0) {
    return typeSchemas
  }

  return {
    ...typeSchemas,
    request: {
      ...typeSchemas.request,
      schema: {
        ...typeSchemas.request.schema,
        required: ['__kubb_required_request_body__'],
      },
    },
  }
}

export const mutationGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query',
  Operation({ config, plugin, operation, generator }) {
    const {
      options,
      options: { output },
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const isQuery = !!options.query && options.query?.methods.some((method) => operation.method === method)
    const isMutation =
      options.mutation !== false &&
      !isQuery &&
      difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some((method) => operation.method === method)

    const importPath = options.mutation ? options.mutation.importPath : '@tanstack/react-query'

    const mutation = {
      name: getName(operation, { type: 'function', prefix: 'use' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      //todo remove type?
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginKey: [pluginZodName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
    }

    const hasClientPlugin = !!pluginManager.getPluginByKey([pluginClientName])
    // Class-based clients are not compatible with query hooks, so we generate inline clients
    const shouldUseClientPlugin = hasClientPlugin && options.client.clientType !== 'class'
    const typeSchemas = shouldUseClientPlugin ? type.schemas : withRequiredRequestBodySchema(type.schemas)
    const client = {
      name: shouldUseClientPlugin
        ? getName(operation, {
            type: 'function',
            pluginKey: [pluginClientName],
          })
        : getName(operation, {
            type: 'function',
          }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
    }

    const mutationOptions = {
      name: getName(operation, { type: 'function', suffix: 'MutationOptions' }),
    }

    const mutationKey = {
      name: getName(operation, { type: 'const', suffix: 'MutationKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'MutationKey' }),
    }

    if (!isMutation) {
      return null
    }

    return (
      <File
        baseName={mutation.file.baseName}
        path={mutation.file.path}
        meta={mutation.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && (
          <File.Import name={[zod.schemas.response.name, zod.schemas.request?.name].filter(Boolean)} root={mutation.file.path} path={zod.file.path} />
        )}
        {options.client.importPath ? (
          <>
            <File.Import name={'fetch'} path={options.client.importPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
            {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            <File.Import name={['fetch']} root={mutation.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={mutation.file.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
              isTypeOnly
            />
            {options.client.dataReturnType === 'full' && (
              <File.Import
                name={['ResponseConfig']}
                root={mutation.file.path}
                path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
                isTypeOnly
              />
            )}
          </>
        )}
        {shouldUseClientPlugin && <File.Import name={[client.name]} root={mutation.file.path} path={client.file.path} />}
        {!shouldUseClientPlugin && (
          <File.Import name={['buildFormData']} root={mutation.file.path} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />
        )}
        {options.customOptions && <File.Import name={[options.customOptions.name]} path={options.customOptions.importPath} />}
        <File.Import
          name={[
            typeSchemas.request?.name,
            typeSchemas.response.name,
            typeSchemas.pathParams?.name,
            typeSchemas.queryParams?.name,
            typeSchemas.headerParams?.name,
            ...(typeSchemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={mutation.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <MutationKey
          name={mutationKey.name}
          typeName={mutationKey.typeName}
          operation={operation}
          pathParamsType={options.pathParamsType}
          typeSchemas={typeSchemas}
          paramsCasing={options.paramsCasing}
          transformer={options.mutationKey}
        />

        {!shouldUseClientPlugin && (
          <Client
            name={client.name}
            baseURL={options.client.baseURL}
            operation={operation}
            typeSchemas={typeSchemas}
            zodSchemas={zod.schemas}
            dataReturnType={options.client.dataReturnType || 'data'}
            paramsCasing={options.client?.paramsCasing || options.paramsCasing}
            paramsType={options.paramsType}
            pathParamsType={options.pathParamsType}
            parser={options.parser}
          />
        )}
        <File.Import name={['mutationOptions']} path={importPath} />

        <MutationOptions
          name={mutationOptions.name}
          clientName={client.name}
          mutationKeyName={mutationKey.name}
          typeSchemas={typeSchemas}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          dataReturnType={options.client.dataReturnType || 'data'}
        />
        {options.mutation && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['UseMutationOptions', 'UseMutationResult', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutation.name}
              mutationOptionsName={mutationOptions.name}
              typeName={mutation.typeName}
              typeSchemas={typeSchemas}
              operation={operation}
              dataReturnType={options.client.dataReturnType || 'data'}
              paramsCasing={options.paramsCasing}
              pathParamsType={options.pathParamsType}
              mutationKeyName={mutationKey.name}
              customOptions={options.customOptions}
            />
          </>
        )}
      </File>
    )
  },
})

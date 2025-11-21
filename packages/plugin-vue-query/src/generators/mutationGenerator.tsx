import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { difference } from 'remeda'
import { Mutation, MutationKey } from '../components'
import type { PluginVueQuery } from '../types'

export const mutationGenerator = createReactGenerator<PluginVueQuery>({
  name: 'vue-query',
  Operation({ config, operation, generator, plugin }) {
    const {
      options,
      options: { output },
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const isQuery = !!options.query && options.query?.methods.some((method) => operation.method === method)
    const isMutation =
      !isQuery &&
      difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some((method) => operation.method === method)

    const importPath = options.mutation ? options.mutation.importPath : '@tanstack/vue-query'

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
    const client = {
      name: hasClientPlugin
        ? getName(operation, {
            type: 'function',
            pluginKey: [pluginClientName],
          })
        : getName(operation, {
            type: 'function',
          }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
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
            <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
            {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            <File.Import name={['fetch']} root={mutation.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
            <File.Import
              name={['RequestConfig', 'ResponseErrorConfig']}
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
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />
        {!!hasClientPlugin && <File.Import name={[client.name]} root={mutation.file.path} path={client.file.path} />}
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
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
          paramsCasing={options.paramsCasing}
          typeSchemas={type.schemas}
          transformer={options.mutationKey}
        />
        {!hasClientPlugin && (
          <Client
            name={client.name}
            baseURL={options.client.baseURL}
            operation={operation}
            typeSchemas={type.schemas}
            zodSchemas={zod.schemas}
            dataReturnType={options.client.dataReturnType || 'data'}
            paramsCasing={options.paramsCasing}
            paramsType={options.paramsType}
            pathParamsType={options.pathParamsType}
            parser={options.parser}
          />
        )}
        {options.mutation && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['MutationObserverOptions', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutation.name}
              clientName={client.name}
              typeName={mutation.typeName}
              typeSchemas={type.schemas}
              operation={operation}
              paramsCasing={options.paramsCasing}
              dataReturnType={options.client.dataReturnType || 'data'}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              mutationKeyName={mutationKey.name}
            />
          </>
        )}
      </File>
    )
  },
})

import path from 'node:path'
import { useDriver } from '@kubb/core/hooks'
import { ClientLegacy as Client, pluginClientName } from '@kubb/plugin-client'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import { Mutation, MutationKey } from '../components'
import type { PluginSwr } from '../types'

export const mutationGenerator = createReactGenerator<PluginSwr>({
  name: 'swr-mutation',
  Operation({ config, operation, generator, plugin }) {
    const {
      options,
      options: { output },
    } = plugin
    const driver = useDriver()
    const root = path.resolve(config.root, config.output.path)

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const isQuery = !!options.query && options.query?.methods.some((method) => operation.method === method)
    const isMutation =
      options.mutation !== false &&
      !isQuery &&
      difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some((method) => operation.method === method)

    const importPath = options.mutation ? options.mutation.importPath : 'swr'

    const mutation = {
      name: getName(operation, { type: 'function', prefix: 'use' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use' }),
    }

    const type = {
      file: getFile(operation, { pluginName: pluginTsName }),
      //todo remove type?
      schemas: getSchemas(operation, { pluginName: pluginTsName, type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginName: pluginZodName }),
      schemas: getSchemas(operation, { pluginName: pluginZodName, type: 'function' }),
    }

    const hasClientPlugin = !!driver.getPlugin(pluginClientName)
    // Class-based clients are not compatible with query hooks, so we generate inline clients
    const shouldUseClientPlugin = hasClientPlugin && options.client.clientType !== 'class'
    const client = {
      name: shouldUseClientPlugin
        ? getName(operation, {
            type: 'function',
            pluginName: pluginClientName,
          })
        : getName(operation, {
            type: 'function',
          }),
      file: getFile(operation, { pluginName: pluginClientName }),
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
        banner={getBanner({ oas, output, config: driver.config })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && (
          <File.Import name={[zod.schemas.response.name, zod.schemas.request?.name].filter(Boolean)} root={mutation.file.path} path={zod.file.path} />
        )}
        {options.client.importPath ? (
          <>
            {!shouldUseClientPlugin && <File.Import name={'fetch'} path={options.client.importPath} />}
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
            {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            {!shouldUseClientPlugin && <File.Import name={['fetch']} root={mutation.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />}
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={mutation.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
            {options.client.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={mutation.file.path} path={path.resolve(root, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}
        <File.Import name="useSWRMutation" path={importPath} />
        <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path={importPath} isTypeOnly />
        {shouldUseClientPlugin && <File.Import name={[client.name]} root={mutation.file.path} path={client.file.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={mutation.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
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
          typeSchemas={type.schemas}
          paramsCasing={options.paramsCasing}
          transformer={options.mutationKey}
        />

        {!shouldUseClientPlugin && (
          <Client
            name={client.name}
            baseURL={options.client.baseURL}
            operation={operation}
            typeSchemas={type.schemas}
            zodSchemas={zod.schemas}
            dataReturnType={options.client.dataReturnType || 'data'}
            paramsCasing={options.client?.paramsCasing || options.paramsCasing}
            paramsType={options.paramsType}
            pathParamsType={options.pathParamsType}
            parser={options.parser}
          />
        )}
        {options.mutation && (
          <Mutation
            name={mutation.name}
            clientName={client.name}
            typeName={mutation.typeName}
            typeSchemas={type.schemas}
            operation={operation}
            dataReturnType={options.client.dataReturnType || 'data'}
            paramsType={options.paramsType}
            paramsCasing={options.paramsCasing}
            pathParamsType={options.pathParamsType}
            mutationKeyName={mutationKey.name}
            mutationKeyTypeName={mutationKey.typeName}
            paramsToTrigger={options.mutation.paramsToTrigger}
          />
        )}
      </File>
    )
  },
})

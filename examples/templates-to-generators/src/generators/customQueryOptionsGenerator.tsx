// Custom Query Options Generator - Converted from v2.x templates to v4 generators
// This demonstrates the migration from the old templates pattern to the new generators pattern

import { PackageManager } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { getNestedAccessor } from '@kubb/core/utils'
import { isOptional } from '@kubb/oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { QueryKey } from '@kubb/plugin-react-query/components'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

const reactQueryDepRegex = /@tanstack\/(react|solid|vue|svelte)-query/

export const customQueryOptionsGenerator = createReactGenerator<PluginReactQuery>({
  name: 'custom-query-options',
  Operation({ operation, generator, plugin }) {
    const { getName, getFile, getSchemas } = useOperationManager(generator)

    // Get type schemas
    const typeSchemas = getSchemas(operation, {
      pluginKey: ['plugin-ts'],
      type: 'type',
    })

    // Get zod schemas if parser is enabled
    const zodSchemas =
      plugin.options.parser === 'zod'
        ? getSchemas(operation, {
            pluginKey: ['plugin-zod'],
            type: 'function',
          })
        : undefined

    // Only process query operations (GET requests)
    const isQuery = operation.method === 'get'
    if (!isQuery) {
      return null
    }

    // Setup names for generated functions/constants
    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
      file: getFile(operation),
    }

    const client = {
      name: getName(operation, { type: 'function' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'QueryKey' }),
    }

    // Check TanStack Query version
    const isV5 = new PackageManager().isValidSync(reactQueryDepRegex, '>=5')

    // Determine content type and FormData usage
    const contentType = operation.getContentType() || 'application/json'
    const isFormData = contentType === 'multipart/form-data'

    // Build headers
    const headers = [contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined, typeSchemas.headerParams ? '...headers' : undefined]
      .filter(Boolean)
      .join(', ')

    // Build client options for regular query
    const clientOptions = [
      `method: "${operation.method}"`,
      `url: \`${operation.path}\``,
      `signal`,
      typeSchemas.queryParams && !plugin.options.infinite ? 'params' : undefined,
      typeSchemas.request && !isFormData ? 'data' : undefined,
      typeSchemas.request && isFormData ? 'data: formData' : undefined,
      headers ? `headers: { ${headers}, ...config.headers }` : undefined,
      '...config',
    ].filter(Boolean)

    const resolvedClientOptions = `${transformers.createIndent(6)}${clientOptions.join(`,\n${transformers.createIndent(6)}`)}`

    // Build client options for infinite query
    const infiniteClientOptions = plugin.options.infinite
      ? [
          `method: "${operation.method}"`,
          `url: \`${operation.path}\``,
          `signal`,
          typeSchemas.request && !isFormData ? 'data' : undefined,
          typeSchemas.request && isFormData ? 'data: formData' : undefined,
          headers ? `headers: { ${headers}, ...config.headers }` : undefined,
          '...config',
          `params: {
        ...params,
        ['${plugin.options.infinite.queryParam}']: pageParam,
        ...(config.params || {}),
      }`,
        ].filter(Boolean)
      : []

    const resolvedInfiniteClientOptions = `${transformers.createIndent(6)}${infiniteClientOptions.join(`,\n${transformers.createIndent(6)}`)}`

    // Build query options for infinite query
    const infiniteQueryOptions =
      plugin.options.infinite && isV5
        ? [
            `initialPageParam: ${JSON.stringify(plugin.options.infinite.initialPageParam)}`,
            plugin.options.infinite.nextParam
              ? `getNextPageParam: (lastPage) => ${getNestedAccessor('lastPage', plugin.options.infinite.nextParam)}`
              : !plugin.options.infinite.cursorParam && plugin.options.client.dataReturnType === 'full'
                ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1'
                : !plugin.options.infinite.cursorParam && plugin.options.client.dataReturnType === 'data'
                  ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => ((lastPage as any).page?.totalPages ?? 0) > ((lastPage as any).page?.number ?? 0) + 1 ? ((lastPage as any).page?.number ?? 0) + 1 : undefined'
                  : undefined,
            plugin.options.infinite.previousParam
              ? `getPreviousPageParam: (firstPage) => ${getNestedAccessor('firstPage', plugin.options.infinite.previousParam)}`
              : !plugin.options.infinite.cursorParam
                ? 'getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1'
                : undefined,
          ].filter(Boolean)
        : []

    const resolvedInfiniteQueryOptions = infiniteQueryOptions.length ? `${transformers.createIndent(6)}${infiniteQueryOptions.join(`,\n${transformers.createIndent(6)}`)}` : ''

    // FormData handling code
    const formDataCode = isFormData
      ? `
        const formData = new FormData()
        if(data) {
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
              formData.append(key, value);
            }
          })
        }
      `
      : ''

    // Performance timer helper
    const timedFunction = `
      async function timed<T>(
        name: string,
        fn: () => Promise<T> | T,
      ): Promise<T> {
        const start = performance.now();

        try {
          const result = await fn();
          const d = performance.now() - start;
          console.log(\`[perf] \${name}: \${d.toFixed(1)}ms\`);
          return result;
        } catch (e) {
          const d = performance.now() - start;
          console.log(\`[perf] \${name}: threw after \${d.toFixed(1)}ms\`);
          throw e;
        }
      }
    `

    // Return statement based on dataReturnType and parser
    let returnStatement = 'return res.data'
    if (plugin.options.client.dataReturnType === 'full') {
      returnStatement = zodSchemas?.response?.name ? `return {...res, data: ${zodSchemas.response.name}(res.data)}` : 'return res'
    } else if (zodSchemas?.response?.name) {
      returnStatement = `return ${zodSchemas.response.name}(res.data)`
    }

    // Build function parameters
    const params =
      plugin.options.paramsType === 'object'
        ? FunctionParams.factory({
            data: {
              mode: 'object',
              children: {
                ...getPathParams(typeSchemas.pathParams, { typed: true, casing: plugin.options.paramsCasing }),
                data: typeSchemas.request?.name
                  ? {
                      type: typeSchemas.request?.name,
                      optional: isOptional(typeSchemas.request?.schema),
                    }
                  : undefined,
                params: typeSchemas.queryParams?.name
                  ? {
                      type: typeSchemas.queryParams?.name,
                      optional: isOptional(typeSchemas.queryParams?.schema),
                    }
                  : undefined,
                headers: typeSchemas.headerParams?.name
                  ? {
                      type: typeSchemas.headerParams?.name,
                      optional: isOptional(typeSchemas.headerParams?.schema),
                    }
                  : undefined,
              },
            },
            config: {
              type: typeSchemas.request?.name
                ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
                : 'Partial<RequestConfig> & { client?: typeof fetch }',
              default: '{}',
            },
          })
        : FunctionParams.factory({
            pathParams: typeSchemas.pathParams?.name
              ? {
                  mode: plugin.options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
                  children: getPathParams(typeSchemas.pathParams, { typed: true, casing: plugin.options.paramsCasing }),
                  optional: isOptional(typeSchemas.pathParams?.schema),
                }
              : undefined,
            data: typeSchemas.request?.name
              ? {
                  type: typeSchemas.request?.name,
                  optional: isOptional(typeSchemas.request?.schema),
                }
              : undefined,
            params: typeSchemas.queryParams?.name
              ? {
                  type: typeSchemas.queryParams?.name,
                  optional: isOptional(typeSchemas.queryParams?.schema),
                }
              : undefined,
            headers: typeSchemas.headerParams?.name
              ? {
                  type: typeSchemas.headerParams?.name,
                  optional: isOptional(typeSchemas.headerParams?.schema),
                }
              : undefined,
            config: {
              type: typeSchemas.request?.name
                ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
                : 'Partial<RequestConfig> & { client?: typeof fetch }',
              default: '{}',
            },
          })

    const queryKeyParams = QueryKey.getParams({
      pathParamsType: plugin.options.pathParamsType,
      typeSchemas,
      paramsCasing: plugin.options.paramsCasing,
    })

    const TData = plugin.options.client.dataReturnType === 'data' ? typeSchemas.response.name : `ResponseConfig<${typeSchemas.response.name}>`

    // Render infinite query options
    if (plugin.options.infinite && isV5) {
      return (
        <File baseName={queryOptions.file.baseName} path={queryOptions.file.path} meta={queryOptions.file.meta}>
          <File.Source name={queryOptions.name} isExportable isIndexable>
            <Function name={queryOptions.name} export params={params.toConstructor()}>
              {`
              const queryKey = ${queryKey.name}(${queryKeyParams.toCall()})

              return infiniteQueryOptions<${TData}, Error, ${TData}, typeof queryKey, ${typeof plugin.options.infinite.initialPageParam}>({
                queryKey,
                queryFn: async ({ pageParam, signal }) => {
                  ${formDataCode}
                  const res = await ${client.name}<${typeSchemas.response.name}>({
                    ${resolvedInfiniteClientOptions}
                  })

                  ${returnStatement}
                },
                ${resolvedInfiniteQueryOptions}
              })
              `}
            </Function>
          </File.Source>
        </File>
      )
    }

    // Render regular query options with performance timing
    return (
      <File baseName={queryOptions.file.baseName} path={queryOptions.file.path} meta={queryOptions.file.meta}>
        <File.Source name={queryOptions.name} isExportable isIndexable>
          <Function name={queryOptions.name} export params={params.toConstructor()}>
            {`
            const queryKey = ${queryKey.name}(${queryKeyParams.toCall()})

            ${timedFunction}

            return ${isV5 ? 'queryOptions' : ''}({
              queryKey,
              queryFn: async ({ signal }) => {
                ${formDataCode}
                const res = await timed('${operation.getOperationId()}', async () => ${client.name}<${typeSchemas.response.name}>({
                  ${resolvedClientOptions}
                }))

                ${returnStatement}
              },
            })
            `}
          </Function>
        </File.Source>
      </File>
    )
  },
})

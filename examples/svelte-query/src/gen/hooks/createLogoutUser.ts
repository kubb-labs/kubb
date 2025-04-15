/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 * Source: petStore.yaml
 * Title: Swagger Petstore - OpenAPI 3.0
 * Description: This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
 * Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
 * You can now help us improve the API whether it's by making changes to the definition itself or to the code.
 * That way, with time, we can improve the API in general, and expose some of the new features in OAS3.
 *
 * Some useful links:
 * - [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
 * - [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)
 * OpenAPI spec version: 1.0.11
 */

import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryClient, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/user/logout', ...requestConfig })
  return res.data
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return logoutUser(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function createLogoutUser<TData = LogoutUserQueryResponse, TQueryData = LogoutUserQueryResponse, TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<CreateBaseQueryOptions<LogoutUserQueryResponse, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const {
    query: { client: queryClient, ...queryOptions } = {},
    client: config = {},
  } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = createQuery(
    {
      ...(logoutUserQueryOptions(config) as unknown as CreateBaseQueryOptions),
      queryKey,
      ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
    },
    queryClient,
  ) as CreateQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}

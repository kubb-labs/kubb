import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { TenantsControllerGetTenantsQueryResponse } from '../../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import { tenantsControllerGetTenants } from '../../axios/TenantsService/tenantsControllerGetTenants.ts'

export const tenantsControllerGetTenantsQueryKeySWR = () => [{ url: '/api/tenants' }] as const

export type TenantsControllerGetTenantsQueryKeySWR = ReturnType<typeof tenantsControllerGetTenantsQueryKeySWR>

export function tenantsControllerGetTenantsQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return tenantsControllerGetTenants(config)
    },
  }
}

/**
 * {@link /api/tenants}
 */
export function useTenantsControllerGetTenantsSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<TenantsControllerGetTenantsQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = tenantsControllerGetTenantsQueryKeySWR()

  return useSWR<ResponseConfig<TenantsControllerGetTenantsQueryResponse>, ResponseErrorConfig<Error>, TenantsControllerGetTenantsQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...tenantsControllerGetTenantsQueryOptionsSWR(config),
      ...(immutable
        ? {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }
        : {}),
      ...queryOptions,
    },
  )
}

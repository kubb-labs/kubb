import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetTenantQueryResponse,
  TenantsControllerGetTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import { tenantsControllerGetTenant } from '../../axios/TenantsService/tenantsControllerGetTenant.ts'

export const tenantsControllerGetTenantQueryKeySWR = ({ id }: { id: TenantsControllerGetTenantPathParams['id'] }) =>
  [{ url: '/api/tenants/:id', params: { id: id } }] as const

export type TenantsControllerGetTenantQueryKeySWR = ReturnType<typeof tenantsControllerGetTenantQueryKeySWR>

export function tenantsControllerGetTenantQueryOptionsSWR(
  { id }: { id: TenantsControllerGetTenantPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return tenantsControllerGetTenant({ id }, config)
    },
  }
}

/**
 * {@link /api/tenants/:id}
 */
export function useTenantsControllerGetTenantSWR(
  { id }: { id: TenantsControllerGetTenantPathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<TenantsControllerGetTenantQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = tenantsControllerGetTenantQueryKeySWR({ id })

  return useSWR<ResponseConfig<TenantsControllerGetTenantQueryResponse>, ResponseErrorConfig<Error>, TenantsControllerGetTenantQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...tenantsControllerGetTenantQueryOptionsSWR({ id }, config),
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

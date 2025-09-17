import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetActiveLicenseQueryResponse,
  TenantsControllerGetActiveLicensePathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import { tenantsControllerGetActiveLicense } from '../../axios/TenantsService/tenantsControllerGetActiveLicense.ts'

export const tenantsControllerGetActiveLicenseQueryKeySWR = ({ id }: { id: TenantsControllerGetActiveLicensePathParams['id'] }) =>
  [{ url: '/api/tenants/:id/active-license', params: { id: id } }] as const

export type TenantsControllerGetActiveLicenseQueryKeySWR = ReturnType<typeof tenantsControllerGetActiveLicenseQueryKeySWR>

export function tenantsControllerGetActiveLicenseQueryOptionsSWR(
  { id }: { id: TenantsControllerGetActiveLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return tenantsControllerGetActiveLicense({ id }, config)
    },
  }
}

/**
 * {@link /api/tenants/:id/active-license}
 */
export function useTenantsControllerGetActiveLicenseSWR(
  { id }: { id: TenantsControllerGetActiveLicensePathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = tenantsControllerGetActiveLicenseQueryKeySWR({ id })

  return useSWR<
    ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>,
    ResponseErrorConfig<Error>,
    TenantsControllerGetActiveLicenseQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...tenantsControllerGetActiveLicenseQueryOptionsSWR({ id }, config),
    ...(immutable
      ? {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : {}),
    ...queryOptions,
  })
}

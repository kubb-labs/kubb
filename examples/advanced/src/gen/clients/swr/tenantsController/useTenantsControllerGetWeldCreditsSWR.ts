import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetWeldCreditsQueryResponse,
  TenantsControllerGetWeldCreditsPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import { tenantsControllerGetWeldCredits } from '../../axios/TenantsService/tenantsControllerGetWeldCredits.ts'

export const tenantsControllerGetWeldCreditsQueryKeySWR = ({ id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] }) =>
  [{ url: '/api/tenants/:id/weld-credits', params: { id: id } }] as const

export type TenantsControllerGetWeldCreditsQueryKeySWR = ReturnType<typeof tenantsControllerGetWeldCreditsQueryKeySWR>

export function tenantsControllerGetWeldCreditsQueryOptionsSWR(
  { id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return tenantsControllerGetWeldCredits({ id }, config)
    },
  }
}

/**
 * {@link /api/tenants/:id/weld-credits}
 */
export function useTenantsControllerGetWeldCreditsSWR(
  { id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = tenantsControllerGetWeldCreditsQueryKeySWR({ id })

  return useSWR<ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>, ResponseErrorConfig<Error>, TenantsControllerGetWeldCreditsQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...tenantsControllerGetWeldCreditsQueryOptionsSWR({ id }, config),
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

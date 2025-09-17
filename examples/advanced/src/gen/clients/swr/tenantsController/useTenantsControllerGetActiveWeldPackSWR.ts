import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetActiveWeldPackQueryResponse,
  TenantsControllerGetActiveWeldPackPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import { tenantsControllerGetActiveWeldPack } from '../../axios/TenantsService/tenantsControllerGetActiveWeldPack.ts'

export const tenantsControllerGetActiveWeldPackQueryKeySWR = ({ id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] }) =>
  [{ url: '/api/tenants/:id/active-weldpack', params: { id: id } }] as const

export type TenantsControllerGetActiveWeldPackQueryKeySWR = ReturnType<typeof tenantsControllerGetActiveWeldPackQueryKeySWR>

export function tenantsControllerGetActiveWeldPackQueryOptionsSWR(
  { id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return tenantsControllerGetActiveWeldPack({ id }, config)
    },
  }
}

/**
 * {@link /api/tenants/:id/active-weldpack}
 */
export function useTenantsControllerGetActiveWeldPackSWR(
  { id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = tenantsControllerGetActiveWeldPackQueryKeySWR({ id })

  return useSWR<
    ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>,
    ResponseErrorConfig<Error>,
    TenantsControllerGetActiveWeldPackQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...tenantsControllerGetActiveWeldPackQueryOptionsSWR({ id }, config),
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

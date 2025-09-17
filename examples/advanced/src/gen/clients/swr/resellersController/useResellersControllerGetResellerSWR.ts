import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerGetResellerQueryResponse,
  ResellersControllerGetResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import { resellersControllerGetReseller } from '../../axios/ResellersService/resellersControllerGetReseller.ts'

export const resellersControllerGetResellerQueryKeySWR = ({ id }: { id: ResellersControllerGetResellerPathParams['id'] }) =>
  [{ url: '/api/resellers/:id', params: { id: id } }] as const

export type ResellersControllerGetResellerQueryKeySWR = ReturnType<typeof resellersControllerGetResellerQueryKeySWR>

export function resellersControllerGetResellerQueryOptionsSWR(
  { id }: { id: ResellersControllerGetResellerPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return resellersControllerGetReseller({ id }, config)
    },
  }
}

/**
 * {@link /api/resellers/:id}
 */
export function useResellersControllerGetResellerSWR(
  { id }: { id: ResellersControllerGetResellerPathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<ResellersControllerGetResellerQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = resellersControllerGetResellerQueryKeySWR({ id })

  return useSWR<ResponseConfig<ResellersControllerGetResellerQueryResponse>, ResponseErrorConfig<Error>, ResellersControllerGetResellerQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...resellersControllerGetResellerQueryOptionsSWR({ id }, config),
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

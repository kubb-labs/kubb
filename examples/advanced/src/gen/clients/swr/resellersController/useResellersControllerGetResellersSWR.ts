import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { ResellersControllerGetResellersQueryResponse } from '../../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import { resellersControllerGetResellers } from '../../axios/ResellersService/resellersControllerGetResellers.ts'

export const resellersControllerGetResellersQueryKeySWR = () => [{ url: '/api/resellers' }] as const

export type ResellersControllerGetResellersQueryKeySWR = ReturnType<typeof resellersControllerGetResellersQueryKeySWR>

export function resellersControllerGetResellersQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return resellersControllerGetResellers(config)
    },
  }
}

/**
 * {@link /api/resellers}
 */
export function useResellersControllerGetResellersSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<ResellersControllerGetResellersQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = resellersControllerGetResellersQueryKeySWR()

  return useSWR<ResponseConfig<ResellersControllerGetResellersQueryResponse>, ResponseErrorConfig<Error>, ResellersControllerGetResellersQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...resellersControllerGetResellersQueryOptionsSWR(config),
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

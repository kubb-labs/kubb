import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import { weldPacksControllerGetWeldPacks } from '../../axios/WeldPacksService/weldPacksControllerGetWeldPacks.ts'

export const weldPacksControllerGetWeldPacksQueryKeySWR = () => [{ url: '/api/weldpacks' }] as const

export type WeldPacksControllerGetWeldPacksQueryKeySWR = ReturnType<typeof weldPacksControllerGetWeldPacksQueryKeySWR>

export function weldPacksControllerGetWeldPacksQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return weldPacksControllerGetWeldPacks(config)
    },
  }
}

/**
 * {@link /api/weldpacks}
 */
export function useWeldPacksControllerGetWeldPacksSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = weldPacksControllerGetWeldPacksQueryKeySWR()

  return useSWR<ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>, ResponseErrorConfig<Error>, WeldPacksControllerGetWeldPacksQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...weldPacksControllerGetWeldPacksQueryOptionsSWR(config),
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

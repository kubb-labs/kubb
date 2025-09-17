import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { PartsControllerGetPartsQueryResponse } from '../../../models/ts/partsController/PartsControllerGetParts.ts'
import { partsControllerGetParts } from '../../axios/PartsService/partsControllerGetParts.ts'

export const partsControllerGetPartsQueryKeySWR = () => [{ url: '/api/parts' }] as const

export type PartsControllerGetPartsQueryKeySWR = ReturnType<typeof partsControllerGetPartsQueryKeySWR>

export function partsControllerGetPartsQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return partsControllerGetParts(config)
    },
  }
}

/**
 * {@link /api/parts}
 */
export function usePartsControllerGetPartsSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<PartsControllerGetPartsQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = partsControllerGetPartsQueryKeySWR()

  return useSWR<ResponseConfig<PartsControllerGetPartsQueryResponse>, ResponseErrorConfig<Error>, PartsControllerGetPartsQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...partsControllerGetPartsQueryOptionsSWR(config),
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

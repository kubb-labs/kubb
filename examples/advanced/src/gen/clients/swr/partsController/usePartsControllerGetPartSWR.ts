import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { PartsControllerGetPartQueryResponse, PartsControllerGetPartPathParams } from '../../../models/ts/partsController/PartsControllerGetPart.ts'
import { partsControllerGetPart } from '../../axios/PartsService/partsControllerGetPart.ts'

export const partsControllerGetPartQueryKeySWR = ({ urn }: { urn: PartsControllerGetPartPathParams['urn'] }) =>
  [{ url: '/api/parts/:urn', params: { urn: urn } }] as const

export type PartsControllerGetPartQueryKeySWR = ReturnType<typeof partsControllerGetPartQueryKeySWR>

export function partsControllerGetPartQueryOptionsSWR(
  { urn }: { urn: PartsControllerGetPartPathParams['urn'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return partsControllerGetPart({ urn }, config)
    },
  }
}

/**
 * {@link /api/parts/:urn}
 */
export function usePartsControllerGetPartSWR(
  { urn }: { urn: PartsControllerGetPartPathParams['urn'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<PartsControllerGetPartQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = partsControllerGetPartQueryKeySWR({ urn })

  return useSWR<ResponseConfig<PartsControllerGetPartQueryResponse>, ResponseErrorConfig<Error>, PartsControllerGetPartQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...partsControllerGetPartQueryOptionsSWR({ urn }, config),
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

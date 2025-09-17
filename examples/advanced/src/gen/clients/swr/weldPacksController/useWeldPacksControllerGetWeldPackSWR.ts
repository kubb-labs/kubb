import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerGetWeldPackQueryResponse,
  WeldPacksControllerGetWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import { weldPacksControllerGetWeldPack } from '../../axios/WeldPacksService/weldPacksControllerGetWeldPack.ts'

export const weldPacksControllerGetWeldPackQueryKeySWR = ({ id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] }) =>
  [{ url: '/api/weldpacks/:id', params: { id: id } }] as const

export type WeldPacksControllerGetWeldPackQueryKeySWR = ReturnType<typeof weldPacksControllerGetWeldPackQueryKeySWR>

export function weldPacksControllerGetWeldPackQueryOptionsSWR(
  { id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return weldPacksControllerGetWeldPack({ id }, config)
    },
  }
}

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerGetWeldPackSWR(
  { id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = weldPacksControllerGetWeldPackQueryKeySWR({ id })

  return useSWR<ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>, ResponseErrorConfig<Error>, WeldPacksControllerGetWeldPackQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...weldPacksControllerGetWeldPackQueryOptionsSWR({ id }, config),
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

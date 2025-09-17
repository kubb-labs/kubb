import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeleteWeldPackMutationResponse,
  WeldPacksControllerDeleteWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import { weldPacksControllerDeleteWeldPack } from '../../axios/WeldPacksService/weldPacksControllerDeleteWeldPack.ts'

export const weldPacksControllerDeleteWeldPackMutationKeySWR = () => [{ url: '/api/weldpacks/:id' }] as const

export type WeldPacksControllerDeleteWeldPackMutationKeySWR = ReturnType<typeof weldPacksControllerDeleteWeldPackMutationKeySWR>

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerDeleteWeldPackSWR(
  { id }: { id: WeldPacksControllerDeleteWeldPackPathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<WeldPacksControllerDeleteWeldPackMutationResponse>,
        ResponseErrorConfig<Error>,
        WeldPacksControllerDeleteWeldPackMutationKeySWR
      >
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = weldPacksControllerDeleteWeldPackMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<WeldPacksControllerDeleteWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    WeldPacksControllerDeleteWeldPackMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return weldPacksControllerDeleteWeldPack({ id }, config)
    },
    mutationOptions,
  )
}

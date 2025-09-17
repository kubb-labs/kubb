import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
  WeldPacksControllerUpdateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import { weldPacksControllerUpdateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerUpdateWeldPack.ts'

export const weldPacksControllerUpdateWeldPackMutationKeySWR = () => [{ url: '/api/weldpacks/:id' }] as const

export type WeldPacksControllerUpdateWeldPackMutationKeySWR = ReturnType<typeof weldPacksControllerUpdateWeldPackMutationKeySWR>

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerUpdateWeldPackSWR(
  { id }: { id: WeldPacksControllerUpdateWeldPackPathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<WeldPacksControllerUpdateWeldPackMutationResponse>,
        ResponseErrorConfig<Error>,
        WeldPacksControllerUpdateWeldPackMutationKeySWR,
        WeldPacksControllerUpdateWeldPackMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<WeldPacksControllerUpdateWeldPackMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = weldPacksControllerUpdateWeldPackMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<WeldPacksControllerUpdateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    WeldPacksControllerUpdateWeldPackMutationKeySWR | null,
    WeldPacksControllerUpdateWeldPackMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return weldPacksControllerUpdateWeldPack({ id, data }, config)
    },
    mutationOptions,
  )
}

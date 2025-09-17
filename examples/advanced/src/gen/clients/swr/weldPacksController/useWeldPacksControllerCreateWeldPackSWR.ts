import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import { weldPacksControllerCreateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerCreateWeldPack.ts'

export const weldPacksControllerCreateWeldPackMutationKeySWR = () => [{ url: '/api/weldpacks' }] as const

export type WeldPacksControllerCreateWeldPackMutationKeySWR = ReturnType<typeof weldPacksControllerCreateWeldPackMutationKeySWR>

/**
 * {@link /api/weldpacks}
 */
export function useWeldPacksControllerCreateWeldPackSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<WeldPacksControllerCreateWeldPackMutationResponse>,
        ResponseErrorConfig<Error>,
        WeldPacksControllerCreateWeldPackMutationKeySWR,
        WeldPacksControllerCreateWeldPackMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<WeldPacksControllerCreateWeldPackMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = weldPacksControllerCreateWeldPackMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<WeldPacksControllerCreateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    WeldPacksControllerCreateWeldPackMutationKeySWR | null,
    WeldPacksControllerCreateWeldPackMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return weldPacksControllerCreateWeldPack({ data }, config)
    },
    mutationOptions,
  )
}

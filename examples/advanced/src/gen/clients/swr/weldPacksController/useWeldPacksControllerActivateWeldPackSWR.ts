import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
  WeldPacksControllerActivateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import { weldPacksControllerActivateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerActivateWeldPack.ts'

export const weldPacksControllerActivateWeldPackMutationKeySWR = () => [{ url: '/api/weldpacks/:id/activate' }] as const

export type WeldPacksControllerActivateWeldPackMutationKeySWR = ReturnType<typeof weldPacksControllerActivateWeldPackMutationKeySWR>

/**
 * {@link /api/weldpacks/:id/activate}
 */
export function useWeldPacksControllerActivateWeldPackSWR(
  { id }: { id: WeldPacksControllerActivateWeldPackPathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<WeldPacksControllerActivateWeldPackMutationResponse>,
        ResponseErrorConfig<Error>,
        WeldPacksControllerActivateWeldPackMutationKeySWR,
        WeldPacksControllerActivateWeldPackMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<WeldPacksControllerActivateWeldPackMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = weldPacksControllerActivateWeldPackMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<WeldPacksControllerActivateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    WeldPacksControllerActivateWeldPackMutationKeySWR | null,
    WeldPacksControllerActivateWeldPackMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return weldPacksControllerActivateWeldPack({ id, data }, config)
    },
    mutationOptions,
  )
}

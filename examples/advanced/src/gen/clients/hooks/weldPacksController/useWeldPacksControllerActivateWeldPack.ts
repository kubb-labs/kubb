import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
  WeldPacksControllerActivateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { weldPacksControllerActivateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerActivateWeldPack.ts'
import { useMutation } from '@tanstack/react-query'

export const weldPacksControllerActivateWeldPackMutationKey = () => [{ url: '/api/weldpacks/:id/activate' }] as const

export type WeldPacksControllerActivateWeldPackMutationKey = ReturnType<typeof weldPacksControllerActivateWeldPackMutationKey>

/**
 * {@link /api/weldpacks/:id/activate}
 */
export function useWeldPacksControllerActivateWeldPack<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<WeldPacksControllerActivateWeldPackMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: WeldPacksControllerActivateWeldPackPathParams['id']; data: WeldPacksControllerActivateWeldPackMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<WeldPacksControllerActivateWeldPackMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? weldPacksControllerActivateWeldPackMutationKey()

  return useMutation<
    ResponseConfig<WeldPacksControllerActivateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: WeldPacksControllerActivateWeldPackPathParams['id']; data: WeldPacksControllerActivateWeldPackMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return weldPacksControllerActivateWeldPack({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

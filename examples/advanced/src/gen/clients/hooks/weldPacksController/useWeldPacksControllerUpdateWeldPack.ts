import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
  WeldPacksControllerUpdateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { weldPacksControllerUpdateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerUpdateWeldPack.ts'
import { useMutation } from '@tanstack/react-query'

export const weldPacksControllerUpdateWeldPackMutationKey = () => [{ url: '/api/weldpacks/:id' }] as const

export type WeldPacksControllerUpdateWeldPackMutationKey = ReturnType<typeof weldPacksControllerUpdateWeldPackMutationKey>

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerUpdateWeldPack<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<WeldPacksControllerUpdateWeldPackMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: WeldPacksControllerUpdateWeldPackPathParams['id']; data: WeldPacksControllerUpdateWeldPackMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<WeldPacksControllerUpdateWeldPackMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? weldPacksControllerUpdateWeldPackMutationKey()

  return useMutation<
    ResponseConfig<WeldPacksControllerUpdateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: WeldPacksControllerUpdateWeldPackPathParams['id']; data: WeldPacksControllerUpdateWeldPackMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return weldPacksControllerUpdateWeldPack({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { weldPacksControllerCreateWeldPack } from '../../axios/WeldPacksService/weldPacksControllerCreateWeldPack.ts'
import { useMutation } from '@tanstack/react-query'

export const weldPacksControllerCreateWeldPackMutationKey = () => [{ url: '/api/weldpacks' }] as const

export type WeldPacksControllerCreateWeldPackMutationKey = ReturnType<typeof weldPacksControllerCreateWeldPackMutationKey>

/**
 * {@link /api/weldpacks}
 */
export function useWeldPacksControllerCreateWeldPack<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<WeldPacksControllerCreateWeldPackMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: WeldPacksControllerCreateWeldPackMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<WeldPacksControllerCreateWeldPackMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? weldPacksControllerCreateWeldPackMutationKey()

  return useMutation<
    ResponseConfig<WeldPacksControllerCreateWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: WeldPacksControllerCreateWeldPackMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ data }) => {
        return weldPacksControllerCreateWeldPack({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

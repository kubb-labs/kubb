import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeleteWeldPackMutationResponse,
  WeldPacksControllerDeleteWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { weldPacksControllerDeleteWeldPack } from '../../axios/WeldPacksService/weldPacksControllerDeleteWeldPack.ts'
import { useMutation } from '@tanstack/react-query'

export const weldPacksControllerDeleteWeldPackMutationKey = () => [{ url: '/api/weldpacks/:id' }] as const

export type WeldPacksControllerDeleteWeldPackMutationKey = ReturnType<typeof weldPacksControllerDeleteWeldPackMutationKey>

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerDeleteWeldPack<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<WeldPacksControllerDeleteWeldPackMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: WeldPacksControllerDeleteWeldPackPathParams['id'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? weldPacksControllerDeleteWeldPackMutationKey()

  return useMutation<
    ResponseConfig<WeldPacksControllerDeleteWeldPackMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: WeldPacksControllerDeleteWeldPackPathParams['id'] },
    TContext
  >(
    {
      mutationFn: async ({ id }) => {
        return weldPacksControllerDeleteWeldPack({ id }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

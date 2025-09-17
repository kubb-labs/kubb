import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { resellersControllerCreateReseller } from '../../axios/ResellersService/resellersControllerCreateReseller.ts'
import { useMutation } from '@tanstack/react-query'

export const resellersControllerCreateResellerMutationKey = () => [{ url: '/api/resellers' }] as const

export type ResellersControllerCreateResellerMutationKey = ReturnType<typeof resellersControllerCreateResellerMutationKey>

/**
 * {@link /api/resellers}
 */
export function useResellersControllerCreateReseller<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<ResellersControllerCreateResellerMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: ResellersControllerCreateResellerMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<ResellersControllerCreateResellerMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? resellersControllerCreateResellerMutationKey()

  return useMutation<
    ResponseConfig<ResellersControllerCreateResellerMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: ResellersControllerCreateResellerMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ data }) => {
        return resellersControllerCreateReseller({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

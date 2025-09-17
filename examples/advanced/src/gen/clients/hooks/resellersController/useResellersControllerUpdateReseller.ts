import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
  ResellersControllerUpdateResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { resellersControllerUpdateReseller } from '../../axios/ResellersService/resellersControllerUpdateReseller.ts'
import { useMutation } from '@tanstack/react-query'

export const resellersControllerUpdateResellerMutationKey = () => [{ url: '/api/resellers/:id' }] as const

export type ResellersControllerUpdateResellerMutationKey = ReturnType<typeof resellersControllerUpdateResellerMutationKey>

/**
 * {@link /api/resellers/:id}
 */
export function useResellersControllerUpdateReseller<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<ResellersControllerUpdateResellerMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: ResellersControllerUpdateResellerPathParams['id']; data: ResellersControllerUpdateResellerMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<ResellersControllerUpdateResellerMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? resellersControllerUpdateResellerMutationKey()

  return useMutation<
    ResponseConfig<ResellersControllerUpdateResellerMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: ResellersControllerUpdateResellerPathParams['id']; data: ResellersControllerUpdateResellerMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return resellersControllerUpdateReseller({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

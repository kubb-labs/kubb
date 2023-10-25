import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export function usePlaceOrderPatchHook<TData = PlaceOrderPatchMutationResponse, TError = PlaceOrderPatch405, TVariables = PlaceOrderPatchMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

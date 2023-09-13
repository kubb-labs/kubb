import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export function usePlaceOrderPatch<
  TData = PlaceOrderPatchMutationResponse,
  TError = PlaceOrderPatch405,
  TVariables = PlaceOrderPatchMutationRequest,
>(options?: { mutation?: SWRMutationConfiguration<TData, TError, string, TVariables> }): SWRMutationResponse<TData, TError, string, TVariables> {
  const { mutation: mutationOptions } = options ?? {}
  return useSWRMutation<TData, TError, string, TVariables>(
    `/store/order`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'patch',
        url,
        data,
      })
    },
    mutationOptions,
  )
}

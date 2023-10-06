import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
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
>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): SWRMutationResponse<ResponseConfig<TData>, TError, string, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<ResponseConfig<TData>, TError, string, TVariables>(
    `/store/order`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'patch',
        url,
        data,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

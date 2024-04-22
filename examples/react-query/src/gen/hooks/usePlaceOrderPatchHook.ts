import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type PlaceOrderPatchClient = typeof client<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, PlaceOrderPatchMutationRequest>
type PlaceOrderPatch = {
  data: PlaceOrderPatchMutationResponse
  error: PlaceOrderPatch405
  request: PlaceOrderPatchMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderPatchMutationResponse
  client: {
    parameters: Partial<Parameters<PlaceOrderPatchClient>[0]>
    return: Awaited<ReturnType<PlaceOrderPatchClient>>
  }
}
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export function usePlaceOrderPatchHook(
  options: {
    mutation?: UseMutationOptions<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>
    client?: PlaceOrderPatch['client']['parameters']
  } = {},
): UseMutationResult<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
    mutationFn: async (data) => {
      const res = await client<PlaceOrderPatch['data'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
        method: 'patch',
        url: '/store/order',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

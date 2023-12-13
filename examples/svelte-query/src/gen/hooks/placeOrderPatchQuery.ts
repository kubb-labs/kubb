import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

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
    paramaters: Partial<Parameters<PlaceOrderPatchClient>[0]>
    return: Awaited<ReturnType<PlaceOrderPatchClient>>
  }
}
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order */
export function placeOrderPatchQuery(
  options: {
    mutation?: CreateMutationOptions<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>
    client?: PlaceOrderPatch['client']['paramaters']
  } = {},
): CreateMutationResult<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
    mutationFn: async (data) => {
      const res = await client<PlaceOrderPatch['data'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

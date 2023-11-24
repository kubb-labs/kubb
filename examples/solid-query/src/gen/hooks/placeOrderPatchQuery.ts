import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

type PlaceOrderPatchClient = typeof client<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, PlaceOrderPatchMutationRequest>
type PlaceOrderPatch = {
  data: PlaceOrderPatchMutationResponse
  error: PlaceOrderPatch405
  request: PlaceOrderPatchMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<PlaceOrderPatchClient>>['data']
  unionResponse: Awaited<ReturnType<PlaceOrderPatchClient>> | Awaited<ReturnType<PlaceOrderPatchClient>>['data']
  client: {
    paramaters: Partial<Parameters<PlaceOrderPatchClient>[0]>
    return: Awaited<ReturnType<PlaceOrderPatchClient>>
  }
}
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order */
export function placeOrderPatchQuery<TData = PlaceOrderPatch['response'], TError = PlaceOrderPatch['error']>(
  options: {
    mutation?: CreateMutationOptions<TData, TError, PlaceOrderPatch['request']>
    client?: PlaceOrderPatch['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, PlaceOrderPatch['request']>({
    mutationFn: (data) => {
      return client<PlaceOrderPatch['data'], TError, PlaceOrderPatch['request']>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

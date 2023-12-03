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
  unionResponse: Awaited<ReturnType<PlaceOrderPatchClient>> | PlaceOrderPatchMutationResponse
  client: {
    paramaters: Partial<Parameters<PlaceOrderPatchClient>[0]>
    return: Awaited<ReturnType<PlaceOrderPatchClient>>
  }
}
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order */
export function usePlaceOrderPatchHook<TData = PlaceOrderPatch['response'], TError = PlaceOrderPatch['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, PlaceOrderPatch['request']>
  client?: PlaceOrderPatch['client']['paramaters']
} = {}): UseMutationResult<TData, TError, PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, PlaceOrderPatch['request']>({
    mutationFn: (data) => {
      return client<PlaceOrderPatch['data'], TError, PlaceOrderPatch['request']>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

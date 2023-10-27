import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch'

type PlaceOrderPatch = KubbQueryFactory<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, never, never, never, PlaceOrderPatchMutationResponse, {
  dataReturnType: 'data'
  type: 'mutation'
}> /**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */

export function usePlaceOrderPatchHook<TData = PlaceOrderPatch['response'], TError = PlaceOrderPatch['error'], TVariables = PlaceOrderPatch['request']>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: PlaceOrderPatch['client']['paramaters']
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

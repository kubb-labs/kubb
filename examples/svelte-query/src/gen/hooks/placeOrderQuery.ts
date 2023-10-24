import client from '@kubb/swagger-client/client'

import { createMutation } from '@tanstack/svelte-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../models/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function placeOrderQuery<TData = PlaceOrderMutationResponse, TError = PlaceOrder405, TVariables = PlaceOrderMutationRequest>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

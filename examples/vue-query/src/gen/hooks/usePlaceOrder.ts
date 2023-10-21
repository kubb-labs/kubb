import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../models/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */

export function usePlaceOrder<TData = PlaceOrderMutationResponse, TError = PlaceOrder405, TVariables = PlaceOrderMutationRequest>(
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
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

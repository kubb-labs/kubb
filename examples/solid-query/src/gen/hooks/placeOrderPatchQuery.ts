import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import { createMutation } from '@tanstack/solid-query'
import type { PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../models/PlaceOrderPatch'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */

export function placeOrderPatchQuery<TData = PlaceOrderPatchMutationResponse, TError = PlaceOrderPatch405, TVariables = PlaceOrderPatchMutationRequest>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<ResponseConfig<TData>, TError, TVariables>({
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

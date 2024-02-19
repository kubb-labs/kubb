import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { MaybeRef } from 'vue'

type DeleteOrderClient = typeof client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, never>
type DeleteOrder = {
  data: DeleteOrderMutationResponse
  error: DeleteOrder400 | DeleteOrder404
  request: never
  pathParams: DeleteOrderPathParams
  queryParams: never
  headerParams: never
  response: DeleteOrderMutationResponse
  client: {
    parameters: Partial<Parameters<DeleteOrderClient>[0]>
    return: Awaited<ReturnType<DeleteOrderClient>>
  }
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId */

export function useDeleteOrder(
  refOrderId: MaybeRef<DeleteOrderPathParams['orderId']>,
  options: {
    mutation?: VueMutationObserverOptions<DeleteOrder['response'], DeleteOrder['error'], void, unknown>
    client?: DeleteOrder['client']['parameters']
  } = {},
): UseMutationReturnType<DeleteOrder['response'], DeleteOrder['error'], void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<DeleteOrder['response'], DeleteOrder['error'], void, unknown>({
    mutationFn: async () => {
      const orderId = unref(refOrderId)
      const res = await client<DeleteOrder['data'], DeleteOrder['error'], void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })

      return res.data
    },
    ...mutationOptions,
  })
}

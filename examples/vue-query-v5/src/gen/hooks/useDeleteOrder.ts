import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { UseMutationOptions } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { DeleteOrder400, DeleteOrder404, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../models/DeleteOrder'

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
 * @link /store/order/:orderId
 */
export function useDeleteOrder(
  refOrderId: MaybeRef<DeleteOrderPathParams['orderId']>,
  options: {
    mutation?: UseMutationOptions<DeleteOrder['response'], DeleteOrder['error'], void, unknown>
    client?: DeleteOrder['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const orderId = unref(refOrderId)
      const res = await client<DeleteOrder['data'], DeleteOrder['error'], DeleteOrder['request']>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

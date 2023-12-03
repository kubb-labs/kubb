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
  unionResponse: Awaited<ReturnType<DeleteOrderClient>> | DeleteOrderMutationResponse
  client: {
    paramaters: Partial<Parameters<DeleteOrderClient>[0]>
    return: Awaited<ReturnType<DeleteOrderClient>>
  }
}
/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId */
export function useDeleteOrder<TData = DeleteOrder['response'], TError = DeleteOrder['error']>(
  refOrderId: MaybeRef<DeleteOrderPathParams['orderId']>,
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, void, unknown>
    client?: DeleteOrder['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void, unknown>({
    mutationFn: () => {
      const orderId = unref(refOrderId)
      return client<DeleteOrder['data'], TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

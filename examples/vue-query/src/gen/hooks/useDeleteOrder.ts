import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400 } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: VueMutationObserverOptions<TData, TError, void, unknown>
    client: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  },
): UseMutationReturnType<TData, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, void, unknown>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

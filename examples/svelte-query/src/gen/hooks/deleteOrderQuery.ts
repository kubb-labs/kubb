import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400 } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function deleteOrderQuery<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: CreateMutationOptions<TData, TError, void>
    client: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  },
): CreateMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<TData, TError, void>({
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

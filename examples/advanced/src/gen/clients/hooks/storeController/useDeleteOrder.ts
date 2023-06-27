import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../../../models/ts/storeController/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400 | DeleteOrder404>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, void>
  }
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
      })
    },
    ...mutationOptions,
  })
}

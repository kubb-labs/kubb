import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type {
  DeleteOrderRequest,
  DeleteOrderResponse,
  DeleteOrderPathParams,
  DeleteOrder400,
  DeleteOrder404,
} from '../../models/ts/storeController/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder<TData = DeleteOrderResponse, TError = DeleteOrder400 & DeleteOrder404, TVariables = DeleteOrderRequest>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        data,
      })
    },
    ...mutationOptions,
  })
}

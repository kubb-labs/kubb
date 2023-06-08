import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration } from 'swr/mutation'
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
    mutation?: SWRMutationConfiguration<TData, TError, string>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string>(
    `/store/order/${orderId}`,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,
      })
    },
    mutationOptions
  )
}

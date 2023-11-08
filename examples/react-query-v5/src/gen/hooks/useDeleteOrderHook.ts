import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type DeleteOrder = KubbQueryFactory<
  DeleteOrderMutationResponse,
  DeleteOrder400 | DeleteOrder404,
  never,
  DeleteOrderPathParams,
  never,
  never,
  DeleteOrderMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrderHook<TData = DeleteOrder['response'], TError = DeleteOrder['error']>(orderId: DeleteOrderPathParams['orderId'], options: {
  mutation?: UseMutationOptions<TData, TError, void>
  client?: DeleteOrder['client']['paramaters']
} = {}): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<DeleteOrder['data'], TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

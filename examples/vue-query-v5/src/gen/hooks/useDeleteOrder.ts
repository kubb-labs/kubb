import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { KubbQueryFactory } from './types'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

type DeleteOrder = KubbQueryFactory<
  DeleteOrderMutationResponse,
  DeleteOrder400 | DeleteOrder404,
  never,
  DeleteOrderPathParams,
  never,
  never,
  DeleteOrderMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function useDeleteOrder<TData = DeleteOrder['response'], TError = DeleteOrder['error']>(
  refOrderId: MaybeRef<DeleteOrderPathParams['orderId']>,
  options: {
    mutation?: UseMutationOptions<TData, TError, void, unknown>
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

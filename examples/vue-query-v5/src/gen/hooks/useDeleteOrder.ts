import { unref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { MaybeRef } from 'vue'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'

type DeleteOrder = KubbQueryFactory<
  DeleteOrderMutationResponse,
  DeleteOrder400 | DeleteOrder404,
  never,
  DeleteOrderPathParams,
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
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: DeleteOrder['client']['paramaters']
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, void, unknown>({
    mutationFn: () => {
      const orderId = unref(refOrderId)
      return client<TData, TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

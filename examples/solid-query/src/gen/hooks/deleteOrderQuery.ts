import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
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
export function deleteOrderQuery<TData = DeleteOrder['response'], TError = DeleteOrder['error']>(
  orderId: DeleteOrderPathParams['orderId'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: DeleteOrder['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, void>({
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

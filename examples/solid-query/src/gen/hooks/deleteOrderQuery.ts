import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import { createMutation } from '@tanstack/solid-query'
import type { DeleteOrder400, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function deleteOrderQuery<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  orderId: DeleteOrderPathParams['orderId'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
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

import client from '@kubb/plugin-client/clients/axios'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const deleteOrderMutationKey = () => [{ url: '/store/order/{orderId}' }] as const

export type DeleteOrderMutationKey = ReturnType<typeof deleteOrderMutationKey>

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrder(
  { orderId }: { orderId: DeleteOrderPathParams['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeleteOrderMutationResponse, ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export function useDeleteOrder<TContext>(
  options: {
    mutation?: MutationObserverOptions<
      DeleteOrderMutationResponse,
      ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>,
      { orderId: MaybeRef<DeleteOrderPathParams['orderId']> },
      TContext
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deleteOrderMutationKey()

  return useMutation<
    DeleteOrderMutationResponse,
    ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>,
    { orderId: DeleteOrderPathParams['orderId'] },
    TContext
  >({
    mutationFn: async ({ orderId }) => {
      return deleteOrder({ orderId }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

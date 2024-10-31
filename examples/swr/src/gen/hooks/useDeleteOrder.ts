import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

export const deleteOrderMutationKey = () => [{ url: '/store/order/{orderId}' }] as const

export type DeleteOrderMutationKey = ReturnType<typeof deleteOrderMutationKey>

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
async function deleteOrder(orderId: DeleteOrderPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
    ...config,
  })
  return res.data
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder(
  orderId: DeleteOrderPathParams['orderId'],
  options: {
    mutation?: Parameters<typeof useSWRMutation<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, DeleteOrderMutationKey>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteOrderMutationKey()
  return useSWRMutation<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, DeleteOrderMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteOrder(orderId, config)
    },
    mutationOptions,
  )
}

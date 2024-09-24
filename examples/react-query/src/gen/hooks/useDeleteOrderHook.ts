import client from '@kubb/plugin-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions, MutationKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const deleteOrderMutationKey = () => [{ url: '/store/order/{orderId}' }] as const

export type DeleteOrderMutationKey = ReturnType<typeof deleteOrderMutationKey>

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
async function deleteOrder(
  {
    orderId,
  }: {
    orderId: DeleteOrderPathParams['orderId']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrderHook(
  options: {
    mutation?: UseMutationOptions<
      DeleteOrderMutationResponse,
      DeleteOrder400 | DeleteOrder404,
      {
        orderId: DeleteOrderPathParams['orderId']
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deleteOrderMutationKey()
  return useMutation<
    DeleteOrderMutationResponse,
    DeleteOrder400 | DeleteOrder404,
    {
      orderId: DeleteOrderPathParams['orderId']
    }
  >({
    mutationFn: async ({ orderId }) => {
      return deleteOrder({ orderId }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

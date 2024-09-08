import client from '@kubb/plugin-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

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
    method: 'delete',
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
  return useMutation({
    mutationFn: async ({
      orderId,
    }: {
      orderId: DeleteOrderPathParams['orderId']
    }) => {
      return deleteOrder({ orderId }, config)
    },
    ...mutationOptions,
  })
}

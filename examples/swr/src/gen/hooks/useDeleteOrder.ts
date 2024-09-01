import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

type DeleteOrderClient = typeof client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, never>

type DeleteOrder = {
  data: DeleteOrderMutationResponse
  error: DeleteOrder400 | DeleteOrder404
  request: never
  pathParams: DeleteOrderPathParams
  queryParams: never
  headerParams: never
  response: DeleteOrderMutationResponse
  client: {
    parameters: Partial<Parameters<DeleteOrderClient>[0]>
    return: Awaited<ReturnType<DeleteOrderClient>>
  }
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: SWRMutationConfiguration<DeleteOrder['response'], DeleteOrder['error']>
    client?: DeleteOrder['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<DeleteOrder['response'], DeleteOrder['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/store/order/${orderId}` as const
  return useSWRMutation<DeleteOrder['response'], DeleteOrder['error'], Key>(
    shouldFetch ? url : null,
    async (_url) => {
      const res = await client<DeleteOrder['data'], DeleteOrder['error']>({
        method: 'delete',
        url,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}

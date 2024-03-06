import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

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
 * @link /store/order/:orderId */
export function deleteOrderQuery(
  orderId: DeleteOrderPathParams['orderId'],
  options: {
    mutation?: CreateMutationOptions<
      DeleteOrder['response'],
      DeleteOrder['error'],
      {
        data: DeleteOrder['request']
      }
    >
    client?: DeleteOrder['client']['parameters']
  } = {},
): CreateMutationResult<
  DeleteOrder['response'],
  DeleteOrder['error'],
  {
    data: DeleteOrder['request']
  }
> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<
    DeleteOrder['response'],
    DeleteOrder['error'],
    {
      data: DeleteOrder['request']
    }
  >({
    mutationFn: async () => {
      const res = await client<DeleteOrder['data'], DeleteOrder['error'], DeleteOrder['request']>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

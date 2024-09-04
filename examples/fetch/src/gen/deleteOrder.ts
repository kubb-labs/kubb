import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams } from './models.ts'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export async function deleteOrder(
  orderId: DeleteOrderPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeleteOrderMutationResponse>['data']> {
  const res = await client<DeleteOrderMutationResponse>({
    method: 'delete',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...options,
  })
  return res.data
}

import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams } from './models.ts'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export async function getOrderById(
  orderId: GetOrderByIdPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetOrderByIdQueryResponse>['data']> {
  const res = await client<GetOrderByIdQueryResponse>({
    method: 'get',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...options,
  })
  return res.data
}

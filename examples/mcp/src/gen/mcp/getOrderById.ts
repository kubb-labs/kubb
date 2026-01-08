import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { GetOrderByIdPathParams, GetOrderByIdResponseData, GetOrderByIdStatus400, GetOrderByIdStatus404 } from '../models/ts/GetOrderById.js'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdHandler({ orderId }: { orderId: GetOrderByIdPathParams['orderId'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetOrderByIdResponseData, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>({
    method: 'GET',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore.swagger.io/v2',
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

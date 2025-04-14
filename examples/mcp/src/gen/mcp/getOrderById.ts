import client from '@kubb/plugin-client/clients/axios'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/ts/GetOrderById.js'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdHandler({ orderId }: { orderId: GetOrderByIdPathParams['orderId'] }): Promise<Promise<CallToolResult>> {
  const res = await client<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, unknown>({
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

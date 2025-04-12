import client from '@kubb/plugin-client/clients/axios'
import type { GetInventoryQueryResponse } from '../models/ts/GetInventory.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

function getGetInventoryUrl() {
  return 'https://petstore.swagger.io/v2/store/inventory' as const
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getGetInventoryUrl().toString(),
    ...requestConfig,
  })
  return res.data
}

import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'

type PlaceOrderClient = typeof client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
type PlaceOrder = {
  data: PlaceOrderMutationResponse
  error: PlaceOrder405
  request: PlaceOrderMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderMutationResponse
  client: {
    parameters: Partial<Parameters<PlaceOrderClient>[0]>
    return: Awaited<ReturnType<PlaceOrderClient>>
  }
}
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function usePlaceOrder(options?: {
  mutation?: SWRMutationConfiguration<PlaceOrder['response'], PlaceOrder['error']>
  client?: PlaceOrder['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<PlaceOrder['response'], PlaceOrder['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/store/order' as const
  return useSWRMutation<PlaceOrder['response'], PlaceOrder['error'], typeof url | null>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<PlaceOrder['data'], PlaceOrder['error'], PlaceOrder['request']>({
        method: 'post',
        url,
        data,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}

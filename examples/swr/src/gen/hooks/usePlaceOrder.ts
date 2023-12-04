import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order */
export function usePlaceOrder<TData = PlaceOrderMutationResponse, TError = PlaceOrder405, TVariables = PlaceOrderMutationRequest>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  shouldFetch?: boolean
}): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/store/order` as const
  return useSWRMutation<ResponseConfig<TData>, TError, typeof url | null>(
    shouldFetch ? url : null,
    (_url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

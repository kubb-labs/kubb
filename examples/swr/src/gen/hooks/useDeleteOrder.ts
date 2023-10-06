import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400 } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<ResponseConfig<TData>, TError, string>(
    `/store/order/${orderId}`,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
